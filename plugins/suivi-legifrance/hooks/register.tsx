import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AppelLegifrance } from '../types'
import { estLegifrance, extraireLiens, nomOutil, requete } from './liens'

const appels = atom({ plugin: 'suivi-legifrance', key: 'appels' } as const, [])

const MAX_APPELS = 20

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'legifrance',
      description: 'Liens Légifrance récupérés ; /legifrance effacer pour vider la liste',
      argumentHint: '[effacer]',
    })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const outil = String(e.tool)
    if (!estLegifrance(outil)) return next(e)

    const id = e.tool_use_id ?? `${await $.clock.now()}`
    const entree = e as unknown as Record<string, unknown>
    const appel: AppelLegifrance = { id, outil: nomOutil(outil), requete: requete(entree), etat: 'en-cours', liens: [] }
    await update($, appels, liste => [...liste.filter(a => a.id !== id), appel].slice(-MAX_APPELS))

    const ran = await next(e)
    const fait: AppelLegifrance = {
      ...appel,
      etat: ran.deny !== undefined || ran.isError === true ? 'echec' : 'ok',
      liens: extraireLiens(ran.text ?? ''),
    }
    await update($, appels, liste => liste.map(a => (a.id === id ? fait : a)))

    return ran
  })

  on('command.run', { command: 'legifrance' }, async ($, e) => {
    if (e.args.trim() === 'effacer') {
      await update($, appels, () => [])
      return { text: 'Liste Légifrance vidée.' }
    }
    const liste = await read($, appels)
    if (liste.length === 0) return { text: 'Aucun appel au MCP Légifrance dans cette session.' }

    return {
      text: [...liste].reverse().map(a => [
        `${a.etat === 'echec' ? '✗' : a.etat === 'en-cours' ? '⋯' : '✓'} ${a.outil}${a.requete ? ` — ${a.requete}` : ''} (${a.liens.length} lien${a.liens.length > 1 ? 's' : ''})`,
        ...a.liens.map(l => `   ${l.titre}\n   ${l.url}`),
      ].join('\n')).join('\n\n'),
    }
  })
}
