import type { EngineInterface, Register } from 'claude-code'

// `to11 code claude` sets this to the start of a link to the session's traces,
// `https://<dashboard>/p/<project id>/sessions/`, when the session is routed
// through to11 and the link is not turned off. The project id is the CLI's
// alone: nothing else in Claude's environment names it, so the mod finishes
// the link with Claude's own session id and builds nothing else.
//
// Unset means there is nothing to link to: the session was not started by
// `to11 code` (so it is not traced), or the developer turned the link off.

// Every way a session ends up without a link, in the order they are likely.
const OFF_HINT =
  'A link comes from `to11 code claude` when it routes the session through to11 ' +
  'to a project, unless `--no-session-link`, `--no-gateway` or ' +
  '`TO11_SESSION_LINK=0` turns it off. `TO11_API_URL` or `TO11_GATEWAY_URL` ' +
  'without `TO11_WEB_URL` leaves the dashboard unknown, and a to11 CLI too old ' +
  'to pass the link passes none: update it.'

// The hosts the CLI counts as this machine (`isLoopback` in its web.go):
// `localhost`, and any loopback IP, IPv4-mapped ones included. `URL` hands
// IPv6 back bracketed and compressed, an IPv4-mapped one in hex.
function isLoopback(hostname: string): boolean {
  const host = hostname.replace(/^\[(.*)\]$/, '$1').toLowerCase()
  return (
    host === 'localhost' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    host === '::1' ||
    /^::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}$/.test(host)
  )
}

// A link base the CLI wrote: an https origin, or http on this machine for a
// local dashboard, followed by `/p/<project>/sessions/`. Anything else is not
// the CLI's and is not drawn as a link. The base is returned as written, not
// as `URL` would spell it: `to11 open` compares the host with the port the CLI
// wrote, so a dropped `:443` would make it refuse the link.
//
// Checked on the text itself, then against how `URL` reads it, so a spelling
// the CLI never writes (dot segments, backslashes, user info, `127.1`) is
// refused rather than passed on as something else.
export function checkBase(raw: string | undefined): string | undefined {
  const parts = raw?.match(/^(https?):\/\/([^/?#@\s\\]+)(\/p\/[^/?#\s\\]+\/sessions\/)$/)
  if (raw === undefined || parts === null || parts === undefined) {
    return undefined
  }
  const [, scheme, host = '', path] = parts
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }
  const defaultPort = scheme === 'https' ? '443' : '80'
  const written = host.toLowerCase()
  // `URL` respells an IPv6 address (`::ffff:127.0.0.1` as `::ffff:7f00:1`),
  // which is the same address; any other host must read back as written.
  const sameHost =
    written.startsWith('[') || written === url.host || written === `${url.host}:${defaultPort}`
  if (
    url.pathname !== path ||
    !sameHost ||
    (scheme !== 'https' && !isLoopback(url.hostname))
  ) {
    return undefined
  }
  return raw
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
  } catch (error) {
    // `run` rejects when `to11` cannot start (most often: not on the PATH),
    // when it outlives the call's timeout, or where the host runs no commands.
    const why = error instanceof Error ? error.message : String(error)
    return `${link}\n\nNot opened: \`to11 open\` could not run (${why}). Open the link yourself.`
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

// How long after a session ends each redraw comes, one wait after another.
export const REDRAW_AFTER_END_MS = [250, 1000, 3000] as const

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

  // Where an organization manages Claude Code, a plugin the person installed
  // does not see the classic events, so the hook above never runs there.
  // `session.end` still does: once it has ended, the band is drawn again a
  // little later, by when the next session has its id. That is done for every
  // reason, since more than `/clear` and a resume move the process to another
  // session (`/branch`, a fork), and a redraw as the process exits is harmless.
  // The waits outlive the hook, so the end is not held up.
  on('session.end', async ($, e, next) => {
    const ended = await next(e)
    void (async () => {
      for (const ms of REDRAW_AFTER_END_MS) {
        await $.clock.sleep(ms)
        $.ui.invalidate('ui.render')
      }
    })().catch(() => {}) // a reload mid-wait ends the loop, and that is fine
    return ended
  })

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
