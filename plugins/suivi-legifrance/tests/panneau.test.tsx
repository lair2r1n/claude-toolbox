import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'suivi-legifrance',
  component: 'Pane',
  requestId: 'suivi-legifrance',
  props: {
    title: 'Sources officielles',
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

test('un appel enregistré sans source compte pour Légifrance', async ($, on) => {
  on('state.get', () => ({
    value: { value: [{ id: 'ancien', outil: 'rechercher code', requete: '', etat: 'ok', liens: [] }], version: 1 },
  }))

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /^Légifrance/ }))?.text).toContain('1 appel')
  await ui.unmount()
})

test('deux sources sont groupées séparément', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('tool.call', () => ({ result: {}, text: 'URL: https://www.bodacc.fr/pages/x' }))

  await $.tool.call({ tool: OUTIL, search: '1101' })
  await $.tool.call({ tool: 'mcp__claude_ai_bodacc__bodacc_search_by_name', name: 'DANONE' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /^Légifrance/ }))?.text).toContain('1 appel · 0 lien')
  expect((await ui.find({ type: 'Text', text: /^BODACC/ }))?.text).toContain('1 appel · 1 lien')
  expect((await ui.find({ type: 'Text', text: /bodacc search by name/ }))?.text).toContain('DANONE')
  await ui.unmount()
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
