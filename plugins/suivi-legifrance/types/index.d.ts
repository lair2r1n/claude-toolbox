export type LienJuridique = { titre: string; url: string }

export type Source = 'legifrance' | 'bodacc' | 'rne' | 'bofip'

export type AppelSource = {
  id: string
  // Absente d'un appel enregistré avant la version 0.3.0 : c'est alors Légifrance.
  source?: Source
  outil: string
  requete: string
  etat: 'en-cours' | 'ok' | 'echec'
  liens: LienJuridique[]
}

declare module 'claude-code' {
  interface PluginState {
    'suivi-legifrance': {
      appels: AppelSource[]
    }
  }
}
