import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import { checkBase, openerSaid, sessionLink } from '../hooks/register'

const BASE = 'https://app.to11.ai/p/proj_01M28DJYV13A47ZHSR0S2G5KB8/sessions/'
const ID = 'b53c55df-56f2-450e-89ec-89ad03011b34'
const LINK = BASE + ID

const BAND = {
  plugin: 'to11',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

// `/<command>` as the person types it at the terminal.
function run($: Engine, command: string) {
  return $.command.run({
    command,
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
}

// What the engine draws above the prompt with no plugin: an empty row, here
// keyed so a test can tell it survived beneath the link.
function engineBand(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
}

// A session `to11 code claude` started: the link base set, Claude's id known.
function routed(on: On, id = ID) {
  mock.env(on, { TO11_SESSION_LINK_BASE: BASE })
  on('session.id', () => ({ value: id }))
  engineBand(on)
}

describe('the link', () => {
  test('is the base and the session id, escaped', () => {
    expect(sessionLink(BASE, ID)).toBe(LINK)
    expect(sessionLink(BASE, 'a/b c')).toBe(`${BASE}a%2Fb%20c`)
  })

  test('takes only a base the CLI writes', () => {
    expect(checkBase(BASE)).toBe(BASE)
    expect(checkBase('http://localhost:3000/p/proj_1/sessions/')).toBe(
      'http://localhost:3000/p/proj_1/sessions/',
    )
    for (const refused of [
      undefined,
      '',
      '  ',
      'not a url',
      'http://app.to11.ai/p/proj_1/sessions/',
      'javascript:alert(1)//p/x/sessions/',
      'https://app.to11.ai/p/proj_1/traces/',
      'https://app.to11.ai/p/proj_1/sessions/extra',
      'https://app.to11.ai/p/proj_1/sessions/?x=1',
      'https://app.to11.ai/p/proj_1/sessions/#x',
    ]) {
      expect(checkBase(refused)).toBe(undefined)
    }
  })
})

describe('the band', () => {
  test('draws the link above the prompt in a routed session', async ($, on) => {
    routed(on)
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ ...BAND, surface })
      const link = await ui.find({ type: 'Link' })
      expect(link?.props.href).toBe(LINK)
      expect(link?.text).toBe('to11 ↗ session b53c55df')
      expect(await ui.find({ key: 'engine' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('draws nothing in a session to11 did not start', async ($, on) => {
    mock.env(on, {})
    on('session.id', () => ({ value: ID }))
    engineBand(on)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect(await ui.find({ type: 'Link' })).toBe(undefined)
    await ui.unmount()
  })

  test('draws nothing for a base the CLI would not write', async ($, on) => {
    mock.env(on, { TO11_SESSION_LINK_BASE: 'http://evil.example/p/x/sessions/' })
    on('session.id', () => ({ value: ID }))
    engineBand(on)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect(await ui.find({ type: 'Link' })).toBe(undefined)
    await ui.unmount()
  })

  test('yields to a survey', async ($, on) => {
    routed(on)
    const ui = await $.ui.mount({
      ...BAND,
      surface: 'terminal',
      props: { ...BAND.props, hasSurvey: true },
    })
    expect(await ui.find({ type: 'Link' })).toBe(undefined)
    await ui.unmount()
  })

  test('is hidden by showBand, while the command still answers', { options: { showBand: false } }, async ($, on) => {
    routed(on)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect(await ui.find({ type: 'Link' })).toBe(undefined)
    await ui.unmount()
    const { text } = await run($, 'to11-trace')
    expect(text).toBe(LINK)
  })

  test('follows the session id after /clear', async ($, on) => {
    let id = ID
    mock.env(on, { TO11_SESSION_LINK_BASE: BASE })
    on('session.id', () => ({ value: id }))
    engineBand(on)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    expect((await ui.find({ type: 'Link' }))?.props.href).toBe(LINK)
    id = 'after-clear'
    await ui.redraw()
    expect((await ui.find({ type: 'Link' }))?.props.href).toBe(`${BASE}after-clear`)
    await ui.unmount()
  })
  test('is drawn again once /clear or a resume starts the next session', async ($, on) => {
    const asked: string[] = []
    on('ui.invalidate', ($, e) => {
      asked.push(e.event)
      return { value: undefined }
    })
    on('classic.SessionStart', () => ({}))
    await $.classic.SessionStart({ source: 'clear' })
    expect(asked).toEqual(['ui.render'])
  })
})

describe('/to11-trace', () => {
  test('prints the link', async ($, on) => {
    routed(on)
    const { text } = await run($, 'to11-trace')
    expect(text).toBe(LINK)
  })

  test('says why there is no link', async ($, on) => {
    mock.env(on, {})
    on('session.id', () => ({ value: ID }))
    const { text } = await run($, 'to11-trace')
    expect(text).toMatch(/no to11 link/)
    expect(text).toMatch(/to11 code claude/)
    expect(text).toMatch(/--no-session-link/)
  })
})

describe('/to11-open', () => {
  test('opens the link with the CLI and says so', async ($, on) => {
    routed(on)
    const ran: (readonly string[])[] = []
    on('process.run', ($, e) => {
      ran.push(e.argv)
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    const { text } = await run($, 'to11-open')
    expect(ran).toEqual([['to11', 'open', LINK]])
    expect(text).toBe(`${LINK}\n\nOpened in your browser.`)
  })

  test("prints the link with the CLI's reason when no browser opens", async ($, on) => {
    routed(on)
    on('process.run', () => ({ value: {
      exitCode: 1,
      stdout: '',
      stderr:
        'error: there is no browser to open here\n  ' +
        LINK +
        '\n  this is an SSH session, so a browser opened here would not be in front of you\n  open the link yourself\n',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    } }))
    const { text } = await run($, 'to11-open')
    expect(text).toBe(
      `${LINK}\n\nNot opened: this is an SSH session, so a browser opened here would not be ` +
        'in front of you. Open the link yourself.',
    )
  })

  test('says when the CLI is too old to open links', async ($, on) => {
    routed(on)
    on('process.run', () => ({ value: {
      exitCode: 1,
      stdout: '',
      stderr: 'error: unknown command "open"\n',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    } }))
    const { text } = await run($, 'to11-open')
    expect(text).toMatch(/^https:.*\n\nThis to11 CLI is too old to open links/)
  })

  test('prints the link when the CLI is not installed', async ($, on) => {
    routed(on)
    on('process.run', () => {
      throw new Error('to11: command not found')
    })
    const { text } = await run($, 'to11-open')
    expect(text).toMatch(/not on your PATH/)
    expect(text).toMatch(LINK)
  })

  test('runs nothing without a link', async ($, on) => {
    mock.env(on, {})
    on('session.id', () => ({ value: ID }))
    let ran = false
    on('process.run', () => {
      ran = true
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    const { text } = await run($, 'to11-open')
    expect(ran).toBe(false)
    expect(text).toMatch(/no to11 link to open/)
  })
})

describe('what to11 open said', () => {
  test('is the reason, or the error without one', () => {
    expect(openerSaid('error: the browser could not be opened\n  https://x\n  the system\'s opener said: exit 3\n')).toBe(
      "the system's opener said: exit 3",
    )
    expect(openerSaid('error: only this\n')).toBe('only this')
    expect(openerSaid('plain\n')).toBe('plain')
    expect(openerSaid('')).toBe('')
  })
})
