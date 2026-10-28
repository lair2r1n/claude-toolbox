import { expect, test } from 'claude-code/testing'

import { ajouter, couleurPourcent, formatTokens, formatUsd, jaugeTexte, libelleLimite, partCache } from '../hooks/format'

test('tokens à la française', () => {
  expect(formatTokens(850)).toBe('850')
  expect(formatTokens(12_400)).toBe('12,4 k')
  expect(formatTokens(310_000)).toBe('310 k')
  expect(formatTokens(1_000_000)).toBe('1 M')
  expect(formatTokens(1_250_000)).toBe('1,3 M')
  expect(formatUsd(4.3)).toBe('4,30 $')
})

test('part du cache et cumul', () => {
  const t = { entree: 200, sortie: 50, cacheLu: 9_800, cacheEcrit: 0 }
  expect(partCache(t)).toBe(98)
  expect(partCache({ entree: 0, sortie: 0, cacheLu: 0, cacheEcrit: 0 })).toBe(null)
  expect(ajouter(t, t).cacheLu).toBe(19_600)
})

test('seuils, jauge et limites', () => {
  expect([couleurPourcent(40), couleurPourcent(72), couleurPourcent(90), couleurPourcent(null)])
    .toEqual(['suggestion', 'warning', 'error', 'inactive'])
  expect(jaugeTexte(31)).toBe('▰▰▰▱▱▱▱▱▱▱')
  expect(libelleLimite('five_hour')).toBe('5 h')
  expect(libelleLimite('custom_window')).toBe('custom window')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`la barre se dessine avec des chiffres sur ${surface}`, async ($, on) => {
    on('ui.render', ($$, e) => {
      const { Box } = $$.ui.resolve(e)
      return h(Box, {}) as never
    })
    on('session.usage', () => ({
      value: {
        startedAt: 0,
        context: { tokens: 310_000, window: 1_000_000, percent: 31 },
        rateLimits: [{ kind: 'five_hour', percentUsed: 23 }],
        cost: { usd: 4.32 },
      },
    }) as never)
    on('session.start', () => ({ cwd: '/' }) as never)
    on('clock.every', () => ({ value: undefined }) as never)
    on('session.root', () => ({ value: '/home/dev/mon-projet' }) as never)
    on('process.run', () => ({ value: { exitCode: 0, stdout: 'main\n', stderr: '' } }) as never)
    await $.session.start({ cwd: '/' } as never)
    const barre = await $.ui.mount({
      plugin: 'barre-tokens',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 },
    } as never)
    const arbre = JSON.stringify(await (barre as unknown as { drawn: () => Promise<unknown> }).drawn())
    expect(arbre.includes('31 %')).toBe(true)
    expect(arbre.includes('5 h')).toBe(true)
    expect(arbre.includes('4,32')).toBe(true)
    expect(arbre.includes('mon-projet')).toBe(true)
    expect(arbre.includes('main')).toBe(true)
  })
}
