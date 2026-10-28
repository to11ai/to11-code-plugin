# to11 plugin

A plugin for coding agents, published by [to11.ai](https://to11.ai). It keeps
the skills your company publishes current in your agent, and it refreshes them
while you work.

It works with Claude Code and Codex from one directory: `plugins/to11` carries a
manifest for each, and both read the same skills.

## Install

**Claude Code**

```bash
claude plugin marketplace add to11ai/to11-code-plugin
claude plugin install to11@to11ai
```

**Codex**

```bash
codex plugin marketplace add to11ai/to11-code-plugin
codex plugin add to11@to11ai
```

## What it adds

| Skill           | Does                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| `install-cli`   | Installs the `to11` binary                                                        |
| `configure-cli` | Sets to11 up in your home or a repository from inside the session                 |
| `manage-skills` | Reads and publishes the project's skills from inside a session, without a browser |
| `import-skill`  | Checks a skill's security, ambiguity, correctness and completeness before storing |

Plus a link to the session's traces and session sync in Claude Code (below),
and refresh points, so a skill published by a colleague reaches you while a
session is open rather than at the next one. Claude Code has four: session
start, prompt submitted, command expanded, and before a skill is used. Codex has
the two it supports: session start and prompt submitted.

## A link to the session's traces

In Claude Code, a session started with `to11 code claude` shows a link to its
own traces in to11, one dim row above the prompt:

```text
to11 ↗ session afcb250a
```

It follows `/clear` and `/resume` to the session that takes over. Two commands
answer without a model turn:

| Command       | Does                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `/to11-trace` | Prints the link, for surfaces that draw no row above the prompt          |
| `/to11-open`  | Opens it in your browser with `to11 open`, or says why it could not open |

The CLI builds the link, because only it knows the project: it hands the start
of it to Claude as `TO11_SESSION_LINK_BASE`, and the plugin adds Claude's own
session id. A session `to11 code` did not start is not traced, so it shows no
link; neither does one started with `--no-session-link` or
`TO11_SESSION_LINK=0`. To hide the row and keep the commands, turn off
**Show the session link above the prompt** in `/config`.

The row is drawn by a hooks module, which Claude Code runs from v2.1.287. An
older version ignores it and runs the rest of the plugin as before. The row
never touches your `statusLine`.

## Session sync

In Claude Code, the plugin sends each session to your to11 project after every
response and once more when the session ends, once auto-sync is on. The project
is the one `to11 code claude` routes through, else the one `to11 link` linked:

```bash
to11 session autosync on            # this repository
to11 session autosync on --global   # every repository
```

`to11 link` asks once as well. Either way the setting is yours and stays out of
git; a repository's setting comes before the global one. `to11 session sync`
sends the same sessions by hand.

Both hooks run `to11 code --claude-sync-hook`, which returns at once and sends,
in the background, only what was added since the last send, so a long session
costs no more than a short one. With auto-sync off, which it is until someone
turns it on, they do nothing. They need `to11` 0.33.0 or later; an older CLI
does not know the mode, and the hooks stay quiet rather than report it after
every response. Codex has no sync: `to11 session sync` reads Claude Code's
transcripts only.

## It needs the CLI

The plugin carries instructions, not the program that acts on them. The work is
done by `to11`, a separate binary, and nothing is delivered until it is
installed and configured. A session that starts without it says so, and the
`install-cli` skill installs it.

The refresh points check for the binary before calling it, so a machine without
it is quiet rather than broken.

## Releasing

An agent delivers an update only when the manifest's `version` moves, so every
change bumps it in all three places that hold one:

- `plugins/to11/.claude-plugin/plugin.json`
- `plugins/to11/.codex-plugin/plugin.json`
- the marketplace entry in `.claude-plugin/marketplace.json`

A Codex plugin updates on the Codex manifest's version, so bumping the Claude
side alone ships nothing to Codex. CI checks all three agree.

Auto-update is off by default for a marketplace that is not Anthropic's own. A
developer turns it on in `/plugin` → **Marketplaces** → *Enable auto-update*, or
updates by hand with `claude plugin update to11@to11ai`.

## Documentation

[to11.ai/docs](https://to11.ai/docs/reference/cli) covers the CLI, the
configuration file, and how skills are published.
