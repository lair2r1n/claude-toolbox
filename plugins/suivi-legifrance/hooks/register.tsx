import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AppelSource, Source } from '../types'
import { extraireLiens, libelleSource, nomOutil, requete, sourceDe, SOURCES } from './liens'

const appels = atom({ plugin: 'suivi-legifrance', key: 'appels' } as const, [])

const MAX_APPELS = 40

const PANE = 'suivi-legifrance'
const TITRE = 'Sources officielles'

const ICONES = { 'en-cours': '⋯', ok: '✓', echec: '✗' } as const
const COULEURS = { 'en-cours': 'suggestion', ok: 'success', echec: 'error' } as const

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? 's' : ''}`
}

function compte(liste: AppelSource[]): string {
  return `${pluriel(liste.length, 'appel')} · ${pluriel(liste.reduce((total, a) => total + a.liens.length, 0), 'lien')}`
}

function deLaSource(liste: AppelSource[], source: Source): AppelSource[] {
  return liste.filter(a => (a.source ?? 'legifrance') === source)
}

// Repli quand aucune interface ne peut afficher le panneau.
function enTexte(liste: AppelSource[]): string {
  if (liste.length === 0) return 'Aucun appel à une source officielle dans cette session.'

  return [...liste].reverse().map(a => [
    `${ICONES[a.etat]} ${libelleSource(a.source ?? 'legifrance')} · ${a.outil}${a.requete ? ` — ${a.requete}` : ''} (${pluriel(a.liens.length, 'lien')})`,
    ...a.liens.map(l => `   ${l.titre}\n   ${l.url}`),
  ].join('\n')).join('\n\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'legifrance',
      description: 'Ouvre le panneau des sources officielles ; /legifrance effacer vide la liste',
      argumentHint: '[effacer]',
    })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const outil = String(e.tool)
    const source = sourceDe(outil)
    if (source === null) return next(e)

    const id = e.tool_use_id ?? `${await $.clock.now()}`
    const entree = e as unknown as Record<string, unknown>
    const appel: AppelSource = { id, source, outil: nomOutil(outil), requete: requete(entree), etat: 'en-cours', liens: [] }
    const premier = (await read($, appels)).length === 0
    await update($, appels, liste => [...liste.filter(a => a.id !== id), appel].slice(-MAX_APPELS))
    // Seulement au premier appel : un panneau fermé à la main reste fermé.
    if (premier) void $.ui.open({ id: PANE, title: TITRE })

    const ran = await next(e)
    const fait: AppelSource = {
      ...appel,
      etat: ran.deny !== undefined || ran.isError === true ? 'echec' : 'ok',
      liens: extraireLiens(ran.text ?? '', source),
    }
    await update($, appels, liste => liste.map(a => (a.id === id ? fait : a)))

    return ran
  })

  on('command.run', { command: 'legifrance' }, async ($, e) => {
    if (e.args.trim() === 'effacer') {
      await update($, appels, () => [])
      return { text: 'Liste des sources officielles vidée.' }
    }
    const { isPlaced } = await $.ui.open({ id: PANE, title: TITRE })

    return { text: isPlaced ? 'Panneau des sources officielles ouvert.' : enTexte(await read($, appels)) }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const liste = await read($, appels)

    return (
      <Box flexDirection="column">
        <Box>
          <Text dimColor>{compte(liste)} </Text>
          {liste.length > 0 && (
            <Button key="effacer" label="Effacer" onPress={() => update($, appels, () => [])} />
          )}
        </Box>
        {liste.length === 0 && <Text dimColor>Aucun appel à une source officielle dans cette session.</Text>}
        {SOURCES.filter(s => deLaSource(liste, s.id).length > 0).map(s => (
          <Box key={`source-${s.id}`} flexDirection="column">
            <Text><Text bold>{s.libelle}</Text><Text dimColor> {compte(deLaSource(liste, s.id))}</Text></Text>
            <Box flexDirection="column" borderStyle="round" borderColor="permission" paddingX={1}>
              {deLaSource(liste, s.id).reverse().map(appel => (
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
        ))}
      </Box>
    )
  })
}
