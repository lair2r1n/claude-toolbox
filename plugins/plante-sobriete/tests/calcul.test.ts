import { expect, test } from 'claude-code/testing'

import {
  BUDGET_JOUR_G, BUDGET_NUMERIQUE_ANNUEL_G, BUDGET_NUMERIQUE_MOIS_G, FENETRE_MS, ajouterJour, cleJour, etatPour,
  facteurModele, formatGrammes, formatLitres, grammesTour, joursDepuisTours, litresPour, palierPour,
} from '../hooks/calcul'
import { jaugeTexte } from '../hooks/dessin'

test('budget numérique du jour : 2 t × 4,4 % ÷ 218 jours', () => {
  expect(Math.round(BUDGET_JOUR_G)).toBe(404)
})

test('un tour : 400 tokens de sortie sur Sonnet = la réponse type de l\'ACV Mistral', () => {
  const u = { input_tokens: 0, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, model: 'claude-sonnet-5-5' }
  expect(grammesTour(u).toFixed(2)).toBe('1.14')
  expect(grammesTour({ ...u, model: 'claude-opus-5-5' }) > grammesTour(u)).toBe(true)
  expect(facteurModele('claude-haiku-5-5') < 1).toBe(true)
  // La lecture du cache pèse cinquante fois moins qu'un token de sortie.
  const cache = { ...u, output_tokens: 0, cache_read_input_tokens: 20_000 }
  expect(grammesTour(cache).toFixed(2)).toBe('1.14')
})

test('paliers en part du budget', () => {
  expect([10, 25, 40, 60, 90, 100, 101].map(palierPour))
    .toEqual(['fleur', 'fleur', 'feuillue', 'jaunit', 'fanee', 'fanee', 'dessechee'])
})

test('24 h glissantes : les vieux tours sortent de la fenêtre', () => {
  const maintenant = FENETRE_MS * 3
  const tours = [{ t: maintenant - FENETRE_MS - 1, g: 1000 }, { t: maintenant - 1000, g: BUDGET_JOUR_G * 0.3 }]
  const s = etatPour(tours, {}, maintenant)
  expect(s.pourcentBudget).toBe(30)
  expect(s.pourcentPlafond).toBe(3)
  expect(s.palier).toBe('fleur')
})

test('mois et année civils : cumul par jour rapporté au budget numérique', () => {
  const maintenant = new Date(2026, 9, 28, 15).getTime()
  let jours = ajouterJour({}, new Date(2026, 9, 2).getTime(), BUDGET_NUMERIQUE_MOIS_G * 0.1)
  jours = ajouterJour(jours, maintenant, BUDGET_NUMERIQUE_MOIS_G * 0.15)
  jours = ajouterJour(jours, new Date(2026, 0, 5).getTime(), BUDGET_NUMERIQUE_ANNUEL_G * 0.05)
  jours = ajouterJour(jours, new Date(2025, 11, 31).getTime(), 1_000_000)
  const s = etatPour([], jours, maintenant)
  expect(s.mois.pourcentBudget).toBe(25)
  // 25 % d'un mois = 25/12 % de l'année, plus les 5 % de janvier ; décembre 2025 n'entre pas.
  expect(s.annee.pourcentBudget).toBe(7)
  expect(cleJour(maintenant)).toBe('2026-10-28')
  // Les années de plus d'un an sont oubliées.
  expect(Object.keys(ajouterJour({ '2024-03-01': 5 }, maintenant, 1))).toEqual(['2026-10-28'])
  expect(joursDepuisTours([{ t: maintenant, g: 2 }, { t: maintenant + 1, g: 3 }])['2026-10-28']).toBe(5)
})

test('affichage', () => {
  expect(formatGrammes(38.4)).toBe('38 g')
  expect(formatGrammes(1250)).toBe('1,3 kg')
  // ACV Mistral : 1,14 g de CO₂e vont avec 45 mL d'eau.
  expect(formatLitres(litresPour(1.14))).toBe('45 mL')
  expect(formatLitres(4.5)).toBe('4,5 L')
  expect(formatLitres(107.4)).toBe('107 L')
  expect(formatLitres(1250)).toBe('1,3 m³')
  expect(jaugeTexte(38)).toBe('▰▰▰▰▱▱▱▱▱▱')
  expect(jaugeTexte(250)).toBe('▰▰▰▰▰▰▰▰▰▰')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`la plante se dessine sur ${surface}`, async ($, on) => {
    on('ui.render', ($$, e) => {
      const { Box } = $$.ui.resolve(e)
      return h(Box, {}) as never
    })
    on('clock.now', () => ({ value: FENETRE_MS * 2 }) as never)
    on('clock.every', () => ({ value: undefined }) as never)
    on('store.get', () => ({ value: [{ t: FENETRE_MS * 2 - 1000, g: BUDGET_JOUR_G * 5.68 }] }) as never)
    on('session.start', () => ({ cwd: '/' }) as never)
    await $.session.start({ cwd: '/' } as never)
    const bandeau = await $.ui.mount({
      plugin: 'plante-sobriete',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
    } as never)
    const arbre = JSON.stringify(await (bandeau as unknown as { drawn: () => Promise<unknown> }).drawn())
    expect(arbre.includes('57 %')).toBe(true)
    expect(arbre.includes('mois ')).toBe(true)
    expect(arbre.includes('☁️')).toBe(true)
    expect(arbre.includes('💧')).toBe(true)
    expect(arbre.includes('année ')).toBe(true)
    if (surface === 'terminal') expect(arbre.includes('jaunit')).toBe(true)
  })
}
