// Dessin de la plante, un par palier, pensé pour 24 px (repère interne 20 × 20).

import type { Palier } from '../types'

const POT = '<polygon points="6,15 14,15 13,20 7,20" fill="#A0674B"/>'

function feuille(cx: number, cy: number, rx: number, ry: number, angle: number, couleur: string): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${couleur}" transform="rotate(${angle} ${cx} ${cy})"/>`
}

const PLANTES: Record<Palier, string> = {
  fleur: [
    '<path d="M10 15 L10 7" stroke="#3B6D11" stroke-width="1.2" fill="none"/>',
    feuille(7.5, 11, 3, 1.4, -25, '#639922'),
    feuille(12.5, 10, 3, 1.4, 25, '#639922'),
    '<circle cx="10" cy="5" r="3" fill="#ED93B1"/><circle cx="10" cy="5" r="1.2" fill="#FAC775"/>',
  ].join(''),
  feuillue: [
    '<path d="M10 15 L10 5" stroke="#3B6D11" stroke-width="1.2" fill="none"/>',
    feuille(7.5, 12, 3, 1.3, -25, '#639922'),
    feuille(12.5, 10.5, 3, 1.3, 25, '#639922'),
    feuille(7.8, 8, 2.6, 1.2, -25, '#97C459'),
    feuille(12.2, 6.5, 2.4, 1.1, 25, '#97C459'),
  ].join(''),
  jaunit: [
    '<path d="M10 15 Q10.5 10 11.5 6" stroke="#639922" stroke-width="1.2" fill="none"/>',
    feuille(7.5, 12.5, 3, 1.3, -5, '#97C459'),
    feuille(13, 11, 2.8, 1.2, 40, '#C9B13A'),
    feuille(8.5, 9, 2.5, 1.1, -45, '#EF9F27'),
    feuille(13.5, 7.5, 2.3, 1, 50, '#FAC775'),
  ].join(''),
  fanee: [
    '<path d="M10 15 Q10 8 15 9" stroke="#854F0B" stroke-width="1.2" fill="none"/>',
    feuille(8, 12.5, 2.8, 1.1, -65, '#BA7517'),
    feuille(11.5, 11.5, 2.6, 1, 65, '#854F0B'),
    '<circle cx="15.5" cy="10.5" r="1.6" fill="#B4B2A9"/>',
  ].join(''),
  dessechee: [
    '<path d="M10 15 L9.5 11 L11.5 9.5" stroke="#888780" stroke-width="1.2" fill="none"/>',
    feuille(16.5, 19, 2, 0.8, 0, '#5F5E5A'),
  ].join(''),
}

export const TAILLE = 24

function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function plantSvg(palier: Palier, infobulle: string): { source: string; width: number; height: number } {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}" viewBox="0 0 20 20">`
    + `<title>${echapper(infobulle)}</title>${POT}${PLANTES[palier]}</svg>`
  return { source, width: TAILLE, height: TAILLE }
}

export const LIBELLES: Record<Palier, string> = {
  fleur: 'en fleur',
  feuillue: 'feuillue',
  jaunit: 'jaunit',
  fanee: 'fanée',
  dessechee: 'desséchée',
}

// Couleur du texte dans le terminal, où la plante n'est pas dessinée.
export const COULEURS: Record<Palier, 'success' | 'suggestion' | 'warning' | 'error' | 'inactive'> = {
  fleur: 'success',
  feuillue: 'success',
  jaunit: 'warning',
  fanee: 'error',
  dessechee: 'inactive',
}

// Jauge texte (terminal) : 10 cases pour 0 à 100 % de ce qu'on lui donne, pleine au-delà.
export function jaugeTexte(pourcent: number, cases = 10): string {
  const pleines = Math.min(cases, Math.max(0, Math.round((pourcent / 100) * cases)))
  return '▰'.repeat(pleines) + '▱'.repeat(cases - pleines)
}
