// Un tour compté : instant (ms) et émissions estimées (g CO₂e).
export type Tour = { t: number; g: number }

export type Palier = 'fleur' | 'feuillue' | 'jaunit' | 'fanee' | 'dessechee'

// Grammes émis par jour, sous la clé AAAA-MM-JJ (heure locale).
export type Jours = Record<string, number>

export type Cumul = { grammes: number; pourcentBudget: number }

export type Etat = {
  grammes24h: number
  pourcentBudget: number
  palier: Palier
  mois: Cumul
  annee: Cumul
}

declare module 'claude-code' {
  interface PluginState {
    'plante-sobriete': {
      etat: Etat | null
    }
  }
}
