// Repérage pur des appels aux MCP de sources officielles et des liens de leurs réponses.

import type { LienJuridique, Source } from '../types'

// Un serveur Légifrance se reconnaît à son nom, ou à ses outils : un connecteur
// claude.ai peut n'avoir qu'un identifiant opaque, propre à chaque compte.
const SERVEURS_LEGIFRANCE = /open_?legi|legi_?france/i
const OUTILS_LEGIFRANCE = /^(rechercher_code|rechercher_dans_texte_legal|recherche_journal_officiel|dernier_journal_officiel|lister_codes_juridiques|lister_emetteurs_jorf|lister_natures_textes_jorf|rechercher_conventions_collectives|rechercher_decisions_(cnil|constitutionnelles)|rechercher_jurisprudence_(administrative|financiere|judiciaire)|get_decision_(administrative|cnil|constitutionnelle|financiere|judiciaire))$/

type Regle = {
  libelle: string
  url: RegExp
  // Ligne de titre, vue avant l'URL.
  titre?: RegExp
  // Le texte qui précède l'URL sur sa ligne prime sur la ligne de titre.
  titreEnLigne?: boolean
}

function urls(hotes: string): RegExp {
  return new RegExp(`https?://(?:www\\.)?(?:${hotes})/[^\\s)<>"'\\]]+`, 'g')
}

const REGLES: Record<Source, Regle> = {
  legifrance: {
    libelle: 'Légifrance',
    url: urls('legifrance\\.gouv\\.fr'),
    titre: /^\s*(\d+\.\s+\S.*|Article\s+\S.*|ARTICLE\s+\S.*|Titre\s*:.*|Texte\s*:.*|JORF\s.*|Décision\s.*|Arrêt\s.*)$/,
  },
  bodacc: { libelle: 'BODACC', url: urls('bodacc\\.fr'), titre: /^\s*Commercant\s*:.*$/ },
  rne: {
    libelle: 'RNE',
    url: urls('annuaire-entreprises\\.data\\.gouv\\.fr|data\\.inpi\\.fr|legifrance\\.gouv\\.fr'),
    titre: /^\s*(-\s*)?IDCC\s+\d+\s*:.*$/,
    titreEnLigne: true,
  },
  bofip: { libelle: 'BOFiP', url: urls('bofip\\.impots\\.gouv\\.fr'), titre: /^\s*(\[\d+\]\s+\S.*|Titre\s*:.*|Nom\s*:.*)$/ },
}

export const SOURCES = (Object.keys(REGLES) as Source[]).map(id => ({ id, libelle: REGLES[id].libelle }))

export function libelleSource(source: Source): string {
  return REGLES[source].libelle
}

export function sourceDe(outil: string): Source | null {
  if (!outil.startsWith('mcp__')) return null
  const nom = outil.split('__').pop() ?? ''
  if (nom.startsWith('bodacc_')) return 'bodacc'
  if (nom.startsWith('rne_')) return 'rne'
  if (nom.startsWith('bofip_')) return 'bofip'

  return SERVEURS_LEGIFRANCE.test(outil) || OUTILS_LEGIFRANCE.test(nom) ? 'legifrance' : null
}

// Nom lisible : `rechercher_code` → « rechercher code ».
export function nomOutil(outil: string): string {
  return (outil.split('__').pop() ?? outil).replace(/_/g, ' ')
}

// Ce qui a été cherché : les champs de recherche connus, dans cet ordre.
export function requete(entree: Record<string, unknown>): string {
  const morceaux = [
    'search', 'code_name', 'query', 'name', 'nom', 'prenoms', 'siren', 'identifiant_juridique', 'tribunal',
    'ville', 'code_postal', 'region', 'departement', 'activite_principale', 'lat', 'long', 'type_fichier',
    'id', 'text_id', 'numero',
  ]
    .map(cle => entree[cle])
    .filter((v): v is string | number => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''))
  return morceaux.join(' · ')
}

function nettoyer(titre: string): string {
  return titre.trim().replace(/^(\d+\.|\[\d+\]|-)\s+/, '').replace(/^(Titre|Texte|Commercant|Nom)\s*:\s*/, '').replace(/\*\*/g, '')
}

// Chaque URL de la source dans la réponse, avec son titre.
export function extraireLiens(sortie: string, source: Source): LienJuridique[] {
  const regle = REGLES[source]
  const liens: LienJuridique[] = []
  const vus = new Set<string>()
  let dernierTitre = ''
  for (const ligne of sortie.split('\n')) {
    if (regle.titre?.test(ligne) && !/https?:\/\//.test(ligne)) dernierTitre = nettoyer(ligne)
    for (const m of ligne.matchAll(regle.url)) {
      const url = m[0].replace(/[.,;]+$/, '').replace(/^http:/, 'https:')
      if (vus.has(url)) continue
      vus.add(url)
      const enLigne = regle.titreEnLigne ? ligne.slice(0, m.index).replace(/[\s:]+$/, '').trim() : ''
      // « Légifrance : … » ne dit rien : la convention est sur la ligne de titre.
      const libelle = enLigne === 'Légifrance' ? '' : enLigne
      const id = (url.split('/').filter(Boolean).pop() ?? url).replace(/^identifiant=/, '')
      liens.push({ titre: libelle || dernierTitre || id, url })
    }
  }
  return liens
}
