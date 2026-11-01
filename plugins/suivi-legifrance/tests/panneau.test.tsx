import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'suivi-legifrance',
  component: 'Pane',
  requestId: 'suivi-legifrance',
  props: {
    title: 'Légifrance',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const OUTIL = 'mcp__plugin_x_openlegi__rechercher_code'
const REPONSE = [
  'Article 1101 - (VIGUEUR)',
  '• Lien : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040787',
].join('\n')

test('le panneau liste l’appel et son lien, sur chaque interface', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', () => ({ result: {}, text: REPONSE }))

  await $.tool.call({ tool: OUTIL, search: '1101' })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect((await ui.find({ type: 'Text', text: /1 appel · 1 lien/ }))?.text).toContain('1 appel · 1 lien')
    expect((await ui.find({ type: 'Text', text: /rechercher code/ }))?.text).toContain('1101')
    await ui.unmount()
  }
})

test('le panneau s’ouvre au premier appel, une seule fois', async ($, on) => {
  let ouvertures = 0
  on('ui.open', () => {
    ouvertures += 1
    return { value: { isPlaced: true } }
  })
  on('tool.call', () => ({ result: {}, text: REPONSE }))

  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(ouvertures).toBe(0)

  await $.tool.call({ tool: OUTIL, search: '1101' })
  await $.tool.call({ tool: OUTIL, search: '1102' })
  expect(ouvertures).toBe(1)
})

test('Effacer vide la liste', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', () => ({ result: {}, text: REPONSE }))

  await $.tool.call({ tool: OUTIL, search: '1101' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'effacer' })

  expect((await ui.find({ type: 'Text', text: /Aucun appel/ }))?.text).toContain('Aucun appel')
  await ui.unmount()
})
