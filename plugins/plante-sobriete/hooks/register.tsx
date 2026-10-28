import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Jours, Tour } from '../types'
import {
  BUDGET_JOUR_G, BUDGET_NUMERIQUE_ANNUEL_G, BUDGET_NUMERIQUE_MOIS_G, ajouterJour, elaguer, etatPour,
  formatGrammes, grammesTour, joursDepuisTours,
} from './calcul'
import { COULEURS, LIBELLES, jaugeTexte, plantSvg } from './dessin'

const etat = atom({ plugin: 'plante-sobriete', key: 'etat' } as const, null)

// Toutes sessions confondues : $.store est commun aux sessions.
// Tours des dernières 24 h, pour la plante ; cumul par jour, pour le mois et l'année.
const CLE_TOURS = 'tours'
const CLE_JOURS = 'jours'

// Les tours sortent de la fenêtre avec le temps : la plante reverdit sans nouveau tour.
const PERIODE_MS = 60_000

async function lireTours($: EngineInterface): Promise<Tour[]> {
  const brut = await $.store.get(CLE_TOURS)
  return Array.isArray(brut) ? (brut as Tour[]) : []
}

// Avant la version qui cumulait par jour, seuls les tours existaient : on part d'eux.
async function lireJours($: EngineInterface, tours: readonly Tour[]): Promise<Jours> {
  const brut = await $.store.get(CLE_JOURS)
  return brut !== null && typeof brut === 'object' && !Array.isArray(brut) ? (brut as Jours) : joursDepuisTours(tours)
}

async function rafraichir($: EngineInterface) {
  const tours = await lireTours($)
  const suivant = etatPour(tours, await lireJours($, tours), await $.clock.now())
  await update($, etat, avant =>
    avant !== null && avant.pourcentBudget === suivant.pourcentBudget && avant.palier === suivant.palier
      && avant.mois.pourcentBudget === suivant.mois.pourcentBudget
      && avant.annee.pourcentBudget === suivant.annee.pourcentBudget
      ? avant
      : suivant,
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await rafraichir($)
    $.clock.every(PERIODE_MS, () => rafraichir($))

    return next(e)
  })

  // Tours des sous-agents compris : ils consomment autant que la session principale.
  on('turn.complete', async ($, e, next) => {
    const fin = await next(e)
    if (e.usage !== undefined) {
      const maintenant = await $.clock.now()
      const g = grammesTour(e.usage)
      const anciens = await lireTours($)
      const jours = await lireJours($, anciens)
      const tours = elaguer(anciens, maintenant)
      tours.push({ t: maintenant, g })
      await $.store.set(CLE_TOURS, tours)
      await $.store.set(CLE_JOURS, ajouterJour(jours, maintenant, g))
    }
    await rafraichir($)

    return fin
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const dessous = await next(e)
    if (e.props.hasSurvey) return dessous
    const s = await read($, etat)
    if (s === null) return dessous

    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    // Le terminal connaît l'élément Svg mais n'en dessine rien : il garde la version texte.
    const Svg = e.surface !== 'terminal' && 'Svg' in elements ? elements.Svg : undefined
    const infobulle = `Plante ${LIBELLES[s.palier]} : l'IA a émis environ ${formatGrammes(s.grammes24h)} CO₂e en 24 h, `
      + `soit ${s.pourcentBudget} % du budget numérique du jour (${formatGrammes(BUDGET_JOUR_G)}, Accord de Paris, ADEME-Arcep). `
      + `Ce mois-ci : ${formatGrammes(s.mois.grammes)}, ${s.mois.pourcentBudget} % du budget du mois (${formatGrammes(BUDGET_NUMERIQUE_MOIS_G)}). `
      + `Cette année : ${formatGrammes(s.annee.grammes)}, ${s.annee.pourcentBudget} % du budget de l'année (${formatGrammes(BUDGET_NUMERIQUE_ANNUEL_G)}). `
      + 'Facteurs : ACV Mistral Large 2.'
    const cumuls = `mois ${s.mois.pourcentBudget} % · année ${s.annee.pourcentBudget} %`

    // Une barre à elle, la plante calée à droite ; le séparateur la tient à l'écart
    // de la barre des tokens, que barre-tokens ajoute en dessous.
    return (
      <Box flexDirection="column">
        {dessous}
        <Box flexDirection="row" justifyContent="flex-end" alignItems="center" columnGap={1}>
          <Text dimColor>Sobriété IA</Text>
          {Svg
            ? (
                <Box flexDirection="row" columnGap={1} alignItems="center">
                  <Svg key="plante" {...plantSvg(s.palier, infobulle)} isInteractive alt={infobulle} />
                  <Text color={COULEURS[s.palier]} bold>{`${s.pourcentBudget} %`}</Text>
                  <Text dimColor>{cumuls}</Text>
                </Box>
              )
            : (
                <Text>
                  <Text color={COULEURS[s.palier]}>{`${jaugeTexte(s.pourcentBudget)} ${s.pourcentBudget} %`}</Text>
                  <Text dimColor>{` ${LIBELLES[s.palier]} · ${cumuls}`}</Text>
                </Text>
              )}
        </Box>
        <Text dimColor wrap="truncate">{'─'.repeat(Math.max(20, e.props.bodyColumns))}</Text>
      </Box>
    )
  })
}
