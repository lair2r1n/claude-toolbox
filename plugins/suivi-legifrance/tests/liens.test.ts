import { expect, test } from 'claude-code/testing'

import { extraireLiens, nomOutil, requete, sourceDe } from '../hooks/liens'

test('reconnaît chaque source par son serveur ou ses outils', () => {
  expect(sourceDe('mcp__0a1b2c3d-1111-2222-3333-444455556666__rechercher_code')).toBe('legifrance')
  expect(sourceDe('mcp__plugin_controle-acte-vente_openlegi-legifrance__rechercher_code')).toBe('legifrance')
  expect(sourceDe('mcp__claude_ai_open_legi_france__get_decision_cnil')).toBe('legifrance')
  expect(sourceDe('mcp__claude_ai_bodacc__bodacc_search')).toBe('bodacc')
  expect(sourceDe('mcp__0a1b2c3d-1111-2222-3333-444455556666__rne_get_company_data')).toBe('rne')
  expect(sourceDe('mcp__claude_ai_bofip__bofip_rechercher')).toBe('bofip')
  expect(sourceDe('mcp__autre__lister_fichiers')).toBe(null)
  expect(sourceDe('Bash')).toBe(null)
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
  expect(extraireLiens(sortie, 'legifrance')).toEqual([{
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
  const liens = extraireLiens(sortie, 'legifrance')
  expect(liens.length).toBe(2)
  expect(liens[0]?.titre).toBe('Cour de cassation - 09/04/2019 - n°18-82.315 - (Rejet)')
  expect(liens[1]?.url).toBe('https://www.legifrance.gouv.fr/juri/id/JURITEXT000042438731')
})

test('liens BODACC : le commerçant sert de titre', () => {
  const sortie = [
    'Date: 2026-06-21',
    'Commercant: Total Energies Proxi Sud Est',
    'Modifications: Modification de l\'administration.',
    'URL: https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:B202601162809',
  ].join('\n')
  expect(extraireLiens(sortie, 'bodacc')).toEqual([{
    titre: 'Total Energies Proxi Sud Est',
    url: 'https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:B202601162809',
  }])
})

test('liens RNE : le libellé de la ligne sert de titre', () => {
  const sortie = [
    'Annuaire Entreprises: https://annuaire-entreprises.data.gouv.fr/entreprise/552032534',
    'Data INPI: https://data.inpi.fr/entreprises/552032534',
  ].join('\n')
  expect(extraireLiens(sortie, 'rne').map(l => l.titre)).toEqual(['Annuaire Entreprises', 'Data INPI'])
})

test('liens BOFiP : le titre numéroté, puis l\'identifiant à défaut', () => {
  const sortie = [
    '[1] BOI-BIC-RICI-10-10 - BIC - Crédit d’impôt recherche',
    '    Lien (a copier tel quel, ne pas modifier): https://bofip.impots.gouv.fr/bofip/4678-PGP.html/identifiant=BOI-BIC-RICI-10-10-20250813',
  ].join('\n')
  expect(extraireLiens(sortie, 'bofip')[0]?.titre).toBe('BOI-BIC-RICI-10-10 - BIC - Crédit d’impôt recherche')
  expect(extraireLiens('https://bofip.impots.gouv.fr/bofip/1-PGP.html/identifiant=BOI-X-20250101', 'bofip')[0]?.titre).toBe('BOI-X-20250101')
})

test('requête de chaque type d’outil', () => {
  expect(requete({ nom: 'dupont', prenoms: 'marie', per_page: 2 })).toBe('dupont · marie')
  expect(requete({ ville: 'TOULOUSE', famille: 'creation', limit: 2 })).toBe('TOULOUSE')
  expect(requete({ tribunal: 'toulouse', limit: 2 })).toBe('toulouse')
  expect(requete({ lat: 43.6047, long: 1.4442, radius: 1 })).toBe('43.6047 · 1.4442')
  expect(requete({ identifiant_juridique: 'BOI-BIC-RICI-10-10' })).toBe('BOI-BIC-RICI-10-10')
})

test('liens RNE : convention collective, seule ou dans un profil complet', () => {
  const lien = 'https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635782'
  const seule = [
    'IDCC 2149: Convention collective nationale des activités du déchet',
    'État: VIGUEUR_ETEN',
    `Légifrance: ${lien}`,
  ].join('\n')
  expect(extraireLiens(seule, 'rne')).toEqual([{ titre: 'IDCC 2149: Convention collective nationale des activités du déchet', url: lien }])

  const profil = [
    '- IDCC 2149: Convention collective nationale des activités du déchet',
    `  Légifrance: ${lien}`,
    '## LIENS UTILES',
    'Annuaire Entreprises: https://annuaire-entreprises.data.gouv.fr/entreprise/344984869',
    'Extrait RNE/KBIS (téléchargement direct): https://annuaire-entreprises.data.gouv.fr/justificatif-immatriculation-pdf/344984869',
  ].join('\n')
  expect(extraireLiens(profil, 'rne').map(l => l.titre)).toEqual([
    'IDCC 2149: Convention collective nationale des activités du déchet',
    'Annuaire Entreprises',
    'Extrait RNE/KBIS (téléchargement direct)',
  ])
})

test('liens BOFiP : document consulté et fichier téléchargeable', () => {
  const document = [
    '=== BOI-BIC-RICI-10-10 ===',
    'Titre: BIC - Crédit d’impôt recherche',
    'Permalien (a copier tel quel, ne pas modifier): https://bofip.impots.gouv.fr/bofip/4678-PGP.html/identifiant=BOI-BIC-RICI-10-10-20250813',
  ].join('\n')
  expect(extraireLiens(document, 'bofip')[0]?.titre).toBe('BIC - Crédit d’impôt recherche')

  const fichiers = [
    '  Nom: bofip_stock_live_20261028.tgz',
    '  Telechargement: https://bofip.impots.gouv.fr/opendata/stock/10',
  ].join('\n')
  expect(extraireLiens(fichiers, 'bofip')[0]?.titre).toBe('bofip_stock_live_20261028.tgz')
})

test('une réponse sans lien n’en invente pas', () => {
  expect(extraireLiens('SIREN: 884790585\nNom: TOPCO BRETEUIL', 'rne')).toEqual([])
  expect(extraireLiens('=== 30 serie(s) BOFiP ===\n  BIC: 1227 document(s)', 'bofip')).toEqual([])
})
