---
name: install-cli
description: Install the to11 CLI, the `to11` binary that this plugin's skills and refresh hooks need. Use when `to11` is not on PATH, when a session reports that the CLI is missing, or when someone asks how to install to11.
---

This plugin carries skills and refresh points. The work is done by a separate
binary, `to11`, which is not installed with the plugin. Without it the skills
here have nothing to call and no skill is ever delivered.

Check first — if this prints a path, there is nothing to do:

```bash
command -v to11
```

## Install it

Any one of these. Pick the one that matches how the machine already installs
things.

**Homebrew**

```bash
brew install to11ai/tap/to11
```

**asdf**

```bash
asdf plugin add to11 https://github.com/to11ai/asdf-to11
asdf install to11 latest
asdf set --home to11 latest
```

`asdf set` arrived in 0.16. On 0.15 and older the last command is
`asdf global to11 latest`, and `asdf --version` says which applies.

Both write the pin to `$HOME/.tool-versions`, which is the point. The
directory-local forms — `asdf set` without `--home`, and `asdf local` — leave
`to11` resolving only under the current directory while the refresh points go
on looking for it everywhere, and leave a `.tool-versions` behind in whatever
repository the session happened to be in.

**By hand** — every release at
[to11ai/to11-cli](https://github.com/to11ai/to11-cli/releases) carries the
archives and a `checksums.txt`. Take the archive for the platform, verify it
against the checksums, and put `to11` on `PATH`.

Builds exist for Linux and macOS, on x86-64 and arm64. There is no Windows
build.

## Confirm it

```bash
to11 --version
```

## Update it

The same way it was installed.

**Homebrew**

```bash
brew upgrade to11ai/tap/to11
```

**asdf**

```bash
asdf install to11 latest
asdf set --home to11 latest
```

On asdf 0.15 and older the last command is `asdf global to11 latest`.

If `to11 --version` still prints the old version inside a repository, that
repository's `.tool-versions` pins it. Run `asdf set to11 latest` there to move
the pin.

**By hand** — take the newest release from
[to11ai/to11-cli](https://github.com/to11ai/to11-cli/releases) and replace the
binary on `PATH`.

## Then configure it

A binary on `PATH` is not yet configured against a project, so nothing is
delivered yet. The `configure-cli` skill covers that.
