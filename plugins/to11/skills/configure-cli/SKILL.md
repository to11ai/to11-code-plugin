---
name: configure-cli
description: Set up the to11 CLI so the person receives their company's skills in Claude Code and Codex and, optionally, routes Claude Code through to11. Use after installing the CLI, when a to11 command reports that nothing is configured, or when someone asks how to set up to11 in their home or in a repository.
---

`to11 ui` sets up to11 in a screen in the terminal. It signs the person in
through their browser, then walks through their skills, the to11 plugin, and
routing Claude Code through to11. Every step saves when it is confirmed.

If `to11` is not on `PATH`, install it first — the `install-cli` skill covers
that.

## Check the version

`to11 ui` arrived in 0.8.0. Older versions set up with `to11 init`,
which now only points at `to11 ui`.

```bash
to11 --version
```

If it prints a version below 0.8.0, update it the way it was
installed — the `install-cli` skill has the command for each.

## Set it up

`to11 ui` needs a terminal of its own, so it cannot run from inside this
session. Ask the person to open a terminal and run:

```bash
to11 ui
```

Run inside a repository, it first asks whether to set up to11 in the repository
or in the person's home. A repository's files are committed and apply to
everyone who works in it, on top of their own.

When it finishes, check what arrived:

```bash
to11 skill list
```

## Or write the files

Everything `to11 ui` saves is two files, and anybody may write them by hand.
Both live in `~/.to11/` for the person's home, or `<repository>/.to11/` for a
repository.

`skills.yaml` says which skills arrive and where they land:

```yaml
version: 1
organization: acme          # the organization every project below belongs to
projects:
  - project: sre/runbooks   # workspace/project, or a proj_ id
    label: prod             # which version of each skill to follow
targets:                    # claude-code and codex at most once each
  - type: claude-code       # ~/.claude/skills, or <repo>/.claude/skills
  - type: codex             # ~/.agents/skills
```

For any other folder, add a `standard` target with a `path`; it may be listed
once per folder.

`code.claude.yaml` is optional. It says where `to11 code claude` routes a
session, so the session shows up in to11:

```yaml
organization: acme
project: sre/gateway        # workspace/project, or a proj_ id
environment: prod           # an environment slug, or its id
provider: anthropic-to11-cli
```

Both files in one place name the same organization; commands refuse to run
until they do. After editing, run `to11 skill sync`.

Every key, with what it accepts, is in the
[configuration reference](https://to11.ai/docs/reference/cli/configuration).
