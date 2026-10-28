// Calcul pur : tokens d'un tour → g CO₂e, puis part du budget numérique sur 24 h glissantes.
// Sources et hypothèses : METHODE.md.

import type { Cumul, Etat, Jours, Palier, Tour } from '../types'

// Budget : 2 t CO₂e/an/personne (Accord de Paris, repère ADEME) × 4,4 % pour le numérique
// (ADEME-Arcep, janvier 2025) ÷ 218 jours (forfait jours, art. L3121-64 du Code du travail).
export const BUDGET_ANNUEL_G = 2_000_000
export const PART_NUMERIQUE = 0.044
export const JOURS_OUVRES = 218
export const BUDGET_NUMERIQUE_ANNUEL_G = BUDGET_ANNUEL_G * PART_NUMERIQUE
export const BUDGET_NUMERIQUE_MOIS_G = BUDGET_NUMERIQUE_ANNUEL_G / 12
export const BUDGET_JOUR_G = BUDGET_NUMERIQUE_ANNUEL_G / JOURS_OUVRES

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

// Seuils en part du budget numérique du jour. En fleur tant que l'IA seule tient dans tout le
// budget numérique ; desséchée au-delà de dix fois ce budget.
const PALIERS: readonly [number, Palier][] = [
  [100, 'fleur'], [250, 'feuillue'], [500, 'jaunit'], [1000, 'fanee'],
]

export function palierPour(pourcent: number): Palier {
  for (const [seuil, palier] of PALIERS) if (pourcent <= seuil) return palier
  return 'dessechee'
}

function deuxChiffres(n: number): string {
  return String(n).padStart(2, '0')
}

// AAAA-MM-JJ en heure locale.
export function cleJour(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`
}

// Ajoute un tour au cumul de son jour ; ne garde que l'année en cours et la précédente.
export function ajouterJour(jours: Jours, t: number, g: number): Jours {
  const cle = cleJour(t)
  const anneeMin = new Date(t).getFullYear() - 1
  const suivant: Jours = {}
  for (const [k, v] of Object.entries(jours)) if (Number(k.slice(0, 4)) >= anneeMin) suivant[k] = v
  suivant[cle] = (suivant[cle] ?? 0) + g
  return suivant
}

// Reconstitue les cumuls par jour à partir des tours, quand le cumul n'existe pas encore.
export function joursDepuisTours(tours: readonly Tour[]): Jours {
  return tours.reduce<Jours>((j, t) => ajouterJour(j, t.t, t.g), {})
}

function cumul(jours: Jours, prefixe: string, budget: number): Cumul {
  const grammes = Object.entries(jours).reduce((s, [k, v]) => (k.startsWith(prefixe) ? s + v : s), 0)
  return { grammes, pourcentBudget: Math.round((grammes / budget) * 100) }
}

export function etatPour(tours: readonly Tour[], jours: Jours, maintenant: number): Etat {
  const grammes24h = elaguer(tours, maintenant).reduce((s, t) => s + t.g, 0)
  const pourcentBudget = Math.round((grammes24h / BUDGET_JOUR_G) * 100)
  const aujourdhui = cleJour(maintenant)
  return {
    grammes24h,
    pourcentBudget,
    palier: palierPour(pourcentBudget),
    // Mois et année civils en cours, rapportés au budget numérique du mois (1/12) et de l'année.
    mois: cumul(jours, aujourdhui.slice(0, 7), BUDGET_NUMERIQUE_MOIS_G),
    annee: cumul(jours, aujourdhui.slice(0, 4), BUDGET_NUMERIQUE_ANNUEL_G),
  }
}

const ESPACE_FINE = ' '

// 38 g · 1,2 kg
export function formatGrammes(g: number): string {
  if (g < 1000) return `${Math.round(g)}${ESPACE_FINE}g`
  return `${(g / 1000).toFixed(1).replace('.', ',')}${ESPACE_FINE}kg`
}
