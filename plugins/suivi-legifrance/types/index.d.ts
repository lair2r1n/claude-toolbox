export type LienJuridique = { titre: string; url: string }

export type AppelLegifrance = {
  id: string
  outil: string
  requete: string
  etat: 'en-cours' | 'ok' | 'echec'
  liens: LienJuridique[]
}

declare module 'claude-code' {
  interface PluginState {
    'suivi-legifrance': {
      appels: AppelLegifrance[]
    }
  }
}
