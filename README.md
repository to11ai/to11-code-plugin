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

| Skill          | Does                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| `install-cli`  | Installs the `to11` binary                                                     |
| `init-cli`     | Configures this machine against a to11 project, and runs a first sync          |
| `manage-skills`| Reads and publishes the project's skills from inside a session, without a browser |

Plus refresh points, so a skill published by a colleague reaches you while a
session is open rather than at the next one. Claude Code has four: session
start, prompt submitted, command expanded, and before a skill is used. Codex has
the two it supports: session start and prompt submitted.

## It needs the CLI

The plugin carries instructions, not the program that acts on them. The work is
done by `to11`, a separate binary, and nothing is delivered until it is
installed and configured. A session that starts without it says so, and the
`install-cli` skill installs it.

The refresh points check for the binary before calling it, so a machine without
it is quiet rather than broken.

## Releasing

Claude Code delivers an update only when the manifest's `version` moves, so every
change bumps `version` in both `plugins/to11/.claude-plugin/plugin.json` and the
marketplace entry in `.claude-plugin/marketplace.json`. CI checks that the two
agree.

Auto-update is off by default for a marketplace that is not Anthropic's own. A
developer turns it on in `/plugin` → **Marketplaces** → *Enable auto-update*, or
updates by hand with `claude plugin update to11@to11ai`.

## Documentation

[to11.ai/docs](https://to11.ai/docs/reference/cli) covers the CLI, the
configuration file, and how skills are published.
