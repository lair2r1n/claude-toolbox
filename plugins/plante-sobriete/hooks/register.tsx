import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Tour } from '../types'
import { BUDGET_JOUR_G, elaguer, etatPour, formatGrammes, grammesTour } from './calcul'
import { COULEURS, LIBELLES, jaugeTexte, plantSvg } from './dessin'

const etat = atom({ plugin: 'plante-sobriete', key: 'etat' } as const, null)

// Tours des dernières 24 h, toutes sessions confondues : $.store est commun aux sessions.
const CLE_TOURS = 'tours'

// Les tours sortent de la fenêtre avec le temps : la plante reverdit sans nouveau tour.
const PERIODE_MS = 60_000

async function lireTours($: EngineInterface): Promise<Tour[]> {
  const brut = await $.store.get(CLE_TOURS)
  return Array.isArray(brut) ? (brut as Tour[]) : []
}

async function rafraichir($: EngineInterface) {
  const suivant = etatPour(await lireTours($), await $.clock.now())
  await update($, etat, avant =>
    avant !== null && avant.pourcentBudget === suivant.pourcentBudget && avant.palier === suivant.palier ? avant : suivant,
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await rafraichir($)
    $.clock.every(PERIODE_MS, () => rafraichir($))

    return next(e)
  })

  // Tours des sous-agents compris : ils consomment autant que la session principale.
  on('turn.complete', async ($, e, next) => {
    const fin = await next(e)
    if (e.usage !== undefined) {
      const maintenant = await $.clock.now()
      const tours = elaguer(await lireTours($), maintenant)
      tours.push({ t: maintenant, g: grammesTour(e.usage) })
      await $.store.set(CLE_TOURS, tours)
    }
    await rafraichir($)

    return fin
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const dessous = await next(e)
    if (e.props.hasSurvey) return dessous
    const s = await read($, etat)
    if (s === null) return dessous

    const elements = $.ui.resolve(e)
    const { Box, Text } = elements
    // Le terminal connaît l'élément Svg mais n'en dessine rien : il garde la version texte.
    const Svg = e.surface !== 'terminal' && 'Svg' in elements ? elements.Svg : undefined
    const infobulle = `Plante ${LIBELLES[s.palier]} : l'IA a émis environ ${formatGrammes(s.grammes24h)} CO₂e en 24 h, `
      + `soit ${s.pourcentBudget} % du budget numérique du jour (${formatGrammes(BUDGET_JOUR_G)}, Accord de Paris, ADEME-Arcep). `
      + 'Facteurs : ACV Mistral Large 2.'

    // Une barre à elle, sous celles des autres mods, la plante calée à droite.
    return (
      <Box flexDirection="column">
        {dessous}
        <Text dimColor wrap="truncate">{'─'.repeat(Math.max(20, e.props.bodyColumns))}</Text>
        <Box flexDirection="row" justifyContent="flex-end" alignItems="center" columnGap={1}>
          <Text dimColor>Sobriété IA</Text>
          {Svg
            ? (
                <Box flexDirection="row" columnGap={1} alignItems="center">
                  <Svg key="plante" {...plantSvg(s.palier, infobulle)} isInteractive alt={infobulle} />
                  <Text color={COULEURS[s.palier]} bold>{`${s.pourcentBudget} %`}</Text>
                </Box>
              )
            : (
                <Text>
                  <Text color={COULEURS[s.palier]}>{`${jaugeTexte(s.pourcentBudget)} ${s.pourcentBudget} %`}</Text>
                  <Text dimColor> {LIBELLES[s.palier]}</Text>
                </Text>
              )}
        </Box>
      </Box>
    )
  })
}
