// Un tour compté : instant (ms) et émissions estimées (g CO₂e).
export type Tour = { t: number; g: number }

export type Palier = 'fleur' | 'feuillue' | 'jaunit' | 'fanee' | 'dessechee'

export type Etat = {
  grammes24h: number
  pourcentBudget: number
  palier: Palier
}

declare module 'claude-code' {
  interface PluginState {
    'plante-sobriete': {
      etat: Etat | null
    }
  }
}
