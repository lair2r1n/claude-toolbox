import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Instantane, Projet } from '../types'
import {
  ajouter, couleurPourcent, entreeTotale, formatTokens, formatUsd, jaugeSvg, jaugeTexte,
  libelleLimite, partCache,
} from './format'

const instantane = atom({ plugin: 'barre-tokens', key: 'instantane' } as const, null)
const projet = atom({ plugin: 'barre-tokens', key: 'projet' } as const, null)
const dernierTour = atom({ plugin: 'barre-tokens', key: 'dernierTour' } as const, null)
const totaux = atom({ plugin: 'barre-tokens', key: 'totaux' } as const, {
  entree: 0, sortie: 0, cacheLu: 0, cacheEcrit: 0, tours: 0,
})

// Le remplissage du contexte bouge aussi hors des tours (compaction, /clear).
const PERIODE_MS = 15_000

async function rafraichir($: EngineInterface) {
  await lireProjet($)
  const u = await $.session.usage()
  const suivant: Instantane = {
    contexteTokens: u.context.tokens ?? null,
    contexteFenetre: u.context.window,
    contextePourcent: u.context.percent ?? null,
    coutUsd: u.cost?.usd ?? null,
    limites: u.rateLimits.map(l => ({ libelle: libelleLimite(l.kind), pourcent: Math.round(l.percentUsed) })),
  }
  await update($, instantane, () => suivant)
}

// Nom du dossier de la session et branche git courante (null hors d'un dépôt).
async function lireProjet($: EngineInterface) {
  const racine = await $.session.root()
  const nom = racine.replace(/\/+$/, '').split('/').pop() || racine
  const git = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd: racine, timeoutMs: 5000 })
    .catch(() => null)
  const branche = git !== null && git.exitCode === 0 ? git.stdout.trim() || null : null
  const suivant: Projet = { nom, branche }
  await update($, projet, avant =>
    avant !== null && avant.nom === nom && avant.branche === branche ? avant : suivant,
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await rafraichir($)
    $.clock.every(PERIODE_MS, () => rafraichir($))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const fin = await next(e)
    const u = e.usage
    if (u !== undefined) {
      const tour = {
        entree: u.input_tokens,
        sortie: u.output_tokens,
        cacheLu: u.cache_read_input_tokens,
        cacheEcrit: u.cache_creation_input_tokens,
      }
      // Les tours des sous-agents comptent dans la session, pas comme « dernier tour ».
      if (e.agentId === undefined) await update($, dernierTour, () => ({ ...tour, modele: u.model }))
      await update($, totaux, t => ({ ...ajouter(t, tour), tours: t.tours + (e.agentId === undefined ? 1 : 0) }))
    }
    await rafraichir($)

    return fin
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const dessous = await next(e)
    if (e.props.hasSurvey) return dessous
    const i = await read($, instantane)
    const tour = await read($, dernierTour)
    const t = await read($, totaux)
    const p = await read($, projet)
    if (i === null) return dessous

    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const pct = i.contextePourcent
    const cache = tour ? partCache(tour) : null
    const coutTotal = t.tours > 0 || i.coutUsd !== null

    return (
      <Box flexDirection="column">
        {dessous}
        <Box flexDirection="row" flexWrap="wrap" columnGap={2} alignItems="center">
          {p !== null && (
            <Text>
              <Text bold color="claude">{p.nom}</Text>
              {p.branche !== null && <Text dimColor> · {p.branche}</Text>}
            </Text>
          )}
          <Box flexDirection="row" columnGap={1} alignItems="center">
            <Text dimColor>Contexte</Text>
            {Svg
              ? <Box alignSelf="center"><Svg key="jauge-contexte" {...jaugeSvg(pct)} alt={`Contexte rempli à ${pct ?? '?'} %`} /></Box>
              : <Text color={couleurPourcent(pct)}>{jaugeTexte(pct)}</Text>}
            <Text color={couleurPourcent(pct)} bold>{pct === null ? '—' : `${pct} %`}</Text>
            <Text dimColor>
              {i.contexteTokens !== null ? formatTokens(i.contexteTokens) : '?'} / {formatTokens(i.contexteFenetre)}
            </Text>
          </Box>
          {tour !== null && (
            <Text>
              <Text dimColor>Dernier tour </Text>
              {formatTokens(entreeTotale(tour))} ↑ {formatTokens(tour.sortie)} ↓
              {cache !== null && <Text dimColor> · cache {cache} %</Text>}
            </Text>
          )}
          {coutTotal && (
            <Text>
              <Text dimColor>Session </Text>
              {formatTokens(entreeTotale(t) + t.sortie)}
              {i.coutUsd !== null && <Text dimColor> · {formatUsd(i.coutUsd)}</Text>}
            </Text>
          )}
          {i.limites.map(l => (
            <Text key={`limite-${l.libelle}`}>
              <Text dimColor>{l.libelle} </Text>
              <Text color={couleurPourcent(l.pourcent)}>{l.pourcent} %</Text>
            </Text>
          ))}
        </Box>
      </Box>
    )
  })
}
