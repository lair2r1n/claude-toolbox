// Mise en forme pure des chiffres de la barre (typographie française).

import type { Tokens } from '../types'

const ESPACE_FINE = ' '

function decimal(n: number, chiffres: number): string {
  return n.toFixed(chiffres).replace('.', ',').replace(/,0+$/, '')
}

// 850 · 12,4 k · 310 k · 1,2 M
export function formatTokens(n: number): string {
  if (n < 1000) return String(Math.round(n))
  if (n < 1_000_000) return `${decimal(n / 1000, n < 100_000 ? 1 : 0)}${ESPACE_FINE}k`
  return `${decimal(n / 1_000_000, 1)}${ESPACE_FINE}M`
}

export function formatUsd(usd: number): string {
  return `${usd.toFixed(2).replace('.', ',')}${ESPACE_FINE}$`
}

// Tokens d'entrée au total : non cachés + lus du cache + écrits dans le cache.
export function entreeTotale(t: Tokens): number {
  return t.entree + t.cacheLu + t.cacheEcrit
}

// Part de l'entrée servie par le cache, en %.
export function partCache(t: Tokens): number | null {
  const total = entreeTotale(t)
  return total === 0 ? null : Math.round((t.cacheLu / total) * 100)
}

export function ajouter(a: Tokens, b: Tokens): Tokens {
  return {
    entree: a.entree + b.entree,
    sortie: a.sortie + b.sortie,
    cacheLu: a.cacheLu + b.cacheLu,
    cacheEcrit: a.cacheEcrit + b.cacheEcrit,
  }
}

// five_hour → 5 h, seven_day → 7 j ; sinon le nom tel quel.
export function libelleLimite(kind: string): string {
  const connus: Record<string, string> = { five_hour: '5 h', seven_day: '7 j', seven_day_opus: '7 j Opus', spend_limit: 'budget' }
  return connus[kind] ?? kind.replace(/_/g, ' ')
}

export function couleurPourcent(p: number | null): 'suggestion' | 'warning' | 'error' | 'inactive' {
  if (p === null) return 'inactive'
  return p >= 85 ? 'error' : p >= 70 ? 'warning' : 'suggestion'
}

const HEX: Record<string, string> = { suggestion: '#4C7BD9', warning: '#D99A22', error: '#D6453D', inactive: '#9A9A9A' }

// Jauge SVG compacte (desktop) : 90 × 8 px.
export function jaugeSvg(pourcent: number | null): { source: string; width: number; height: number } {
  const w = 90
  const h = 8
  const part = Math.max(0, Math.min(1, (pourcent ?? 0) / 100))
  const couleur = HEX[couleurPourcent(pourcent)] ?? HEX.inactive
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="4" fill="#9A9A9A" opacity="0.25"/><rect width="${(w * part).toFixed(1)}" height="${h}" rx="4" fill="${couleur}"/></svg>`
  return { source, width: w, height: h }
}

// Jauge texte (terminal) : 10 cases.
export function jaugeTexte(pourcent: number | null, cases = 10): string {
  const pleines = Math.round(((pourcent ?? 0) / 100) * cases)
  return '▰'.repeat(Math.min(cases, pleines)) + '▱'.repeat(Math.max(0, cases - pleines))
}
