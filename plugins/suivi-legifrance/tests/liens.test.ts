import { expect, test } from 'claude-code/testing'

import { estLegifrance, extraireLiens, nomOutil, requete } from '../hooks/liens'

test('reconnaît les serveurs MCP Légifrance, par leur nom ou leurs outils', () => {
  expect(estLegifrance('mcp__0a1b2c3d-1111-2222-3333-444455556666__rechercher_code')).toBe(true)
  expect(estLegifrance('mcp__plugin_controle-acte-vente_openlegi-legifrance__rechercher_code')).toBe(true)
  expect(estLegifrance('mcp__claude_ai_open_legi_france__get_decision_cnil')).toBe(true)
  expect(estLegifrance('mcp__autre__lister_fichiers')).toBe(false)
  expect(estLegifrance('Bash')).toBe(false)
  expect(nomOutil('mcp__x__rechercher_jurisprudence_judiciaire')).toBe('rechercher jurisprudence judiciaire')
})

test('requête lisible', () => {
  expect(requete({ search: '1101', code_name: 'Code civil', page_size: 2 })).toBe('1101 · Code civil')
})

test('liens d’un article de code', () => {
  const sortie = [
    '=== ARTICLE CODE 1 ===',
    'Article 1101 - (VIGUEUR) - Chapitre Ier : Dispositions liminaires',
    '• Lien article Légifrance: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040787',
  ].join('\n')
  expect(extraireLiens(sortie)).toEqual([{
    titre: 'Article 1101 - (VIGUEUR) - Chapitre Ier : Dispositions liminaires',
    url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040787',
  }])
})

test('liens d’un panorama de jurisprudence, dédoublonnés', () => {
  const sortie = [
    '1. Cour de cassation - 09/04/2019 - n°18-82.315 - (Rejet)',
    '   Extrait: **électronique** …',
    '   → https://www.legifrance.gouv.fr/juri/id/JURITEXT000038427021',
    '2. Cour de cassation - 07/10/2020 - n°19-18.135 - (Cassation partielle)',
    '   → https://www.legifrance.gouv.fr/juri/id/JURITEXT000042438731',
    'voir aussi https://www.legifrance.gouv.fr/juri/id/JURITEXT000042438731.',
  ].join('\n')
  const liens = extraireLiens(sortie)
  expect(liens.length).toBe(2)
  expect(liens[0]?.titre).toBe('Cour de cassation - 09/04/2019 - n°18-82.315 - (Rejet)')
  expect(liens[1]?.url).toBe('https://www.legifrance.gouv.fr/juri/id/JURITEXT000042438731')
})
