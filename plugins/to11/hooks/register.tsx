import type { EngineInterface, Register } from 'claude-code'

// `to11 code claude` sets this to the start of a link to the session's traces,
// `https://<dashboard>/p/<project id>/sessions/`, when the session is routed
// through to11 and the link is not turned off. The project id is the CLI's
// alone: nothing else in Claude's environment names it, so the mod finishes
// the link with Claude's own session id and builds nothing else.
//
// Unset means there is nothing to link to: the session was not started by
// `to11 code` (so it is not traced), or the developer turned the link off.

const OFF_HINT =
  'Start the session with `to11 code claude` to trace it. If you did, the link ' +
  'is turned off: drop `--no-session-link` or `TO11_SESSION_LINK=0`.'

// A link base the CLI wrote: an https origin, or http on this machine for a
// local dashboard, followed by `/p/<project>/sessions/`. Anything else is not
// the CLI's and is not drawn as a link.
export function checkBase(raw: string | undefined): string | undefined {
  if (raw === undefined || raw.trim() === '') {
    return undefined
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    return undefined
  }
  if (url.search !== '' || url.hash !== '' || !/^\/p\/[^/]+\/sessions\/$/.test(url.pathname)) {
    return undefined
  }
  return url.href
}

export function sessionLink(base: string, sessionId: string): string {
  return base + encodeURIComponent(sessionId)
}

// The id is read on every use, never kept: after `/clear` or a resume the
// process carries on under another session, and `$.session.id()` is the one
// answer that is always the current one.
async function currentLink($: EngineInterface): Promise<string | undefined> {
  const base = checkBase(await $.env.get('TO11_SESSION_LINK_BASE'))
  if (base === undefined) {
    return undefined
  }
  const id = await $.session.id()
  return id === '' ? undefined : sessionLink(base, id)
}

// Why `to11 open` did not open the link, as one line. Its errors read
// `error: <what>`, the link, then why; the why is the part worth showing, and
// the `error:` line stands in where there is none.
export function openerSaid(stderr: string): string {
  const lines = stderr
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
  const at = lines.findIndex(line => line.startsWith('error:'))
  if (at === -1) {
    return lines[0] ?? ''
  }
  return lines[at + 2] ?? (lines[at] ?? '').slice('error:'.length).trim()
}

async function open($: EngineInterface, link: string): Promise<string> {
  let result
  try {
    result = await $.process.run(['to11', 'open', link])
  } catch {
    return `${link}\n\nThe to11 CLI is not on your PATH, so this link was not opened. Open it yourself.`
  }
  if (result.exitCode === 0) {
    return `${link}\n\nOpened in your browser.`
  }
  if (/unknown command "open"/.test(result.stderr)) {
    return `${link}\n\nThis to11 CLI is too old to open links; update it. Open the link yourself.`
  }
  const said = openerSaid(result.stderr)
  return `${link}\n\nNot opened${said === '' ? '' : `: ${said}`}. Open the link yourself.`
}

export const register: Register = (on, options) => {
  const showBand = options.showBand !== false

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'to11-trace',
      description: "Print the link to this session's traces in to11",
    })
    await $.command.register({
      name: 'to11-open',
      description: "Open this session's traces in to11 in your browser",
    })
    return started
  })

  // `session.start` does not fire after `/clear` or a resume, and when
  // `session.end` fires the next session's id does not exist yet. The classic
  // SessionStart does fire for both, once the new id is the session's, so the
  // band is drawn again from there.
  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e)
    $.ui.invalidate('ui.render')
    return result
  }).catch(($, e, next) => next(e)) // a failed redraw never holds the session up

  on('command.run', { command: 'to11-trace' }, async $ => {
    const link = await currentLink($)
    return { text: link ?? `This session has no to11 link. ${OFF_HINT}` }
  })

  on('command.run', { command: 'to11-open' }, async $ => {
    const link = await currentLink($)
    if (link === undefined) {
      return { text: `This session has no to11 link to open. ${OFF_HINT}` }
    }
    return { text: await open($, link) }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const beneath = await next(e)
    if (!showBand || e.props.hasSurvey || e.props.maxRows < 1) {
      return beneath
    }
    const link = await currentLink($)
    if (link === undefined) {
      return beneath
    }
    const id = await $.session.id()
    const { Box, Link, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text dimColor wrap="truncate-end">
          <Link href={link} label={`to11 ↗ session ${id.slice(0, 8)}`} />
        </Text>
        {beneath}
      </Box>
    )
  })
}
