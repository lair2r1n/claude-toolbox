import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AppelLegifrance } from '../types'
import { estLegifrance, extraireLiens, nomOutil, requete } from './liens'

const appels = atom({ plugin: 'suivi-legifrance', key: 'appels' } as const, [])

const MAX_APPELS = 20

const PANE = 'suivi-legifrance'
const TITRE = 'Légifrance'

const ICONES = { 'en-cours': '⋯', ok: '✓', echec: '✗' } as const
const COULEURS = { 'en-cours': 'suggestion', ok: 'success', echec: 'error' } as const

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`
}

// Repli quand aucune interface ne peut afficher le panneau.
function enTexte(liste: AppelLegifrance[]): string {
  if (liste.length === 0) return 'Aucun appel au MCP Légifrance dans cette session.'

  return [...liste].reverse().map(a => [
    `${ICONES[a.etat]} ${a.outil}${a.requete ? ` — ${a.requete}` : ''} (${pluriel(a.liens.length, 'lien')})`,
    ...a.liens.map(l => `   ${l.titre}\n   ${l.url}`),
  ].join('\n')).join('\n\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'legifrance',
      description: 'Ouvre le panneau des liens Légifrance ; /legifrance effacer vide la liste',
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
    const premier = (await read($, appels)).length === 0
    await update($, appels, liste => [...liste.filter(a => a.id !== id), appel].slice(-MAX_APPELS))
    // Seulement au premier appel : un panneau fermé à la main reste fermé.
    if (premier) void $.ui.open({ id: PANE, title: TITRE })

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
    const { isPlaced } = await $.ui.open({ id: PANE, title: TITRE })

    return { text: isPlaced ? 'Panneau Légifrance ouvert.' : enTexte(await read($, appels)) }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const liste = await read($, appels)
    const liens = liste.reduce((total, a) => total + a.liens.length, 0)

    return (
      <Box flexDirection="column">
        <Box>
          <Text dimColor>{pluriel(liste.length, 'appel')} · {pluriel(liens, 'lien')} </Text>
          {liste.length > 0 && (
            <Button key="effacer" label="Effacer" onPress={() => update($, appels, () => [])} />
          )}
        </Box>
        <Box flexDirection="column" borderStyle="round" borderColor="permission" paddingX={1}>
          {liste.length === 0 && <Text dimColor>Aucun appel au MCP Légifrance dans cette session.</Text>}
          {[...liste].reverse().map(appel => (
            <Box key={`appel-${appel.id}`} flexDirection="column">
              <Text wrap="truncate">
                <Text color={COULEURS[appel.etat]} bold>{ICONES[appel.etat]} </Text>
                <Text bold>{appel.outil}</Text>
                {appel.requete !== '' && <Text dimColor> — {appel.requete}</Text>}
              </Text>
              {appel.etat === 'ok' && appel.liens.length === 0 && <Text dimColor>   aucun lien dans la réponse</Text>}
              {appel.liens.map((lien, i) => (
                <Text key={`lien-${appel.id}-${i}`} wrap="truncate">   <Link href={lien.url} label={lien.titre} /></Text>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
