export type Tokens = { entree: number; sortie: number; cacheLu: number; cacheEcrit: number }

export type Instantane = {
  contexteTokens: number | null
  contexteFenetre: number
  contextePourcent: number | null
  coutUsd: number | null
  limites: { libelle: string; pourcent: number }[]
}

export type Projet = { nom: string; branche: string | null }

export type DernierTour = Tokens & { modele: string }

export type Totaux = Tokens & { tours: number }

declare module 'claude-code' {
  interface PluginState {
    'barre-tokens': {
      instantane: Instantane | null
      projet: Projet | null
      dernierTour: DernierTour | null
      totaux: Totaux
    }
  }
}
