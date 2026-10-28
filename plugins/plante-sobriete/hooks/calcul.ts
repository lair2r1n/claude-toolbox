// Calcul pur : tokens d'un tour → g CO₂e, puis part du budget numérique sur 24 h glissantes.
// Sources et hypothèses : METHODE.md.

import type { Etat, Palier, Tour } from '../types'

// Budget : 2 t CO₂e/an/personne (Accord de Paris, repère ADEME) × 4,4 % pour le numérique
// (ADEME-Arcep, janvier 2025) ÷ 218 jours (forfait jours, art. L3121-64 du Code du travail).
export const BUDGET_ANNUEL_G = 2_000_000
export const PART_NUMERIQUE = 0.044
export const JOURS_OUVRES = 218
export const BUDGET_JOUR_G = (BUDGET_ANNUEL_G * PART_NUMERIQUE) / JOURS_OUVRES

// ACV Mistral Large 2 (Carbone 4, ADEME, 2025) : 1,14 g CO₂e pour une réponse de 400 tokens.
export const G_PAR_TOKEN_SORTIE = 1.14 / 400

// Poids d'un token par rapport à un token de sortie, d'après la grille tarifaire Claude :
// entrée = 1/5 de la sortie, écriture du cache = 1,25 × l'entrée, lecture du cache = 0,1 × l'entrée.
const POIDS = { entree: 0.2, cacheEcrit: 0.25, cacheLu: 0.02 } as const

// Taille relative des modèles, d'après le rapport de leurs prix ; Sonnet ≙ Mistral Large 2.
export function facteurModele(modele: string): number {
  const m = modele.toLowerCase()
  if (m.includes('opus')) return 5 / 3
  if (m.includes('haiku')) return 1 / 3
  return 1
}

export type UsageTour = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
  model: string
}

export function grammesTour(u: UsageTour): number {
  const equivalentSortie = u.output_tokens
    + POIDS.entree * u.input_tokens
    + POIDS.cacheEcrit * u.cache_creation_input_tokens
    + POIDS.cacheLu * u.cache_read_input_tokens
  return equivalentSortie * G_PAR_TOKEN_SORTIE * facteurModele(u.model)
}

export const FENETRE_MS = 24 * 60 * 60 * 1000

// Ne garde que les tours des dernières 24 h.
export function elaguer(tours: readonly Tour[], maintenant: number): Tour[] {
  return tours.filter(t => maintenant - t.t < FENETRE_MS)
}

// Seuils en part du budget numérique du jour ; au-delà de 100 %, l'IA seule dépasse tout le budget.
const PALIERS: readonly [number, Palier][] = [
  [10, 'fleur'], [25, 'feuillue'], [50, 'jaunit'], [100, 'fanee'],
]

export function palierPour(pourcent: number): Palier {
  for (const [seuil, palier] of PALIERS) if (pourcent <= seuil) return palier
  return 'dessechee'
}

export function etatPour(tours: readonly Tour[], maintenant: number): Etat {
  const grammes24h = elaguer(tours, maintenant).reduce((s, t) => s + t.g, 0)
  const pourcentBudget = Math.round((grammes24h / BUDGET_JOUR_G) * 100)
  return { grammes24h, pourcentBudget, palier: palierPour(pourcentBudget) }
}

const ESPACE_FINE = ' '

// 38 g · 1,2 kg
export function formatGrammes(g: number): string {
  if (g < 1000) return `${Math.round(g)}${ESPACE_FINE}g`
  return `${(g / 1000).toFixed(1).replace('.', ',')}${ESPACE_FINE}kg`
}
