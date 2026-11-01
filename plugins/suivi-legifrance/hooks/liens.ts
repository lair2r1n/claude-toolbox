// Repérage pur des appels au MCP Légifrance (OpenLegi) et des liens de leurs réponses.

import type { LienJuridique } from '../types'

// Un serveur se reconnaît à son nom, ou à ses outils : un connecteur claude.ai
// peut n'avoir qu'un identifiant opaque, propre à chaque compte.
const SERVEURS = /open_?legi|legi_?france/i
const OUTILS = /^(rechercher_code|rechercher_dans_texte_legal|recherche_journal_officiel|dernier_journal_officiel|lister_codes_juridiques|lister_emetteurs_jorf|lister_natures_textes_jorf|rechercher_conventions_collectives|rechercher_decisions_(cnil|constitutionnelles)|rechercher_jurisprudence_(administrative|financiere|judiciaire)|get_decision_(administrative|cnil|constitutionnelle|financiere|judiciaire))$/

export function estLegifrance(outil: string): boolean {
  if (!outil.startsWith('mcp__')) return false
  return SERVEURS.test(outil) || OUTILS.test(outil.split('__').pop() ?? '')
}

// Nom lisible : `rechercher_code` → « rechercher code ».
export function nomOutil(outil: string): string {
  return (outil.split('__').pop() ?? outil).replace(/_/g, ' ')
}

// Ce qui a été cherché : search, puis les autres champs texte connus.
export function requete(entree: Record<string, unknown>): string {
  const morceaux = ['search', 'code_name', 'query', 'id', 'text_id', 'numero']
    .map(cle => entree[cle])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
  return morceaux.join(' · ')
}

const TITRE = /^\s*(\d+\.\s+\S.*|Article\s+\S.*|ARTICLE\s+\S.*|Titre\s*:.*|Texte\s*:.*|JORF\s.*|Décision\s.*|Arrêt\s.*)$/

function nettoyer(titre: string): string {
  return titre.replace(/^\s*\d+\.\s+/, '').replace(/^(Titre|Texte)\s*:\s*/, '').replace(/\*\*/g, '').trim()
}

// Chaque URL legifrance.gouv.fr de la réponse, avec la dernière ligne de titre vue avant elle.
export function extraireLiens(sortie: string): LienJuridique[] {
  const liens: LienJuridique[] = []
  const vus = new Set<string>()
  let dernierTitre = ''
  for (const ligne of sortie.split('\n')) {
    if (TITRE.test(ligne) && !/https?:\/\//.test(ligne)) dernierTitre = nettoyer(ligne)
    for (const m of ligne.matchAll(/https?:\/\/(?:www\.)?legifrance\.gouv\.fr\/[^\s)<>"'\]]+/g)) {
      const url = m[0].replace(/[.,;]+$/, '').replace(/^http:/, 'https:')
      if (vus.has(url)) continue
      vus.add(url)
      const id = url.split('/').filter(Boolean).pop() ?? url
      liens.push({ titre: dernierTitre || id, url })
    }
  }
  return liens
}
