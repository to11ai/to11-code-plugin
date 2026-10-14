---
name: configure-cli
description: Set up the to11 CLI from inside this session so the person receives their company's skills in Claude Code and Codex and, optionally, routes Claude Code through to11. Use after installing the CLI, when a to11 command reports that nothing is configured, or when someone asks to set up to11 in their home or in a repository.
---

Set to11 up here, in the conversation. The person signs in. You do the rest:
link the folder to a project, put each open choice to them, and show that
skills arrive.

If the person asks how else to set it up, `to11 ui` is the manual way: a
screen of its own in a terminal, outside any coding agent. Do not offer it
otherwise.

## Before you start

Check the installed version before anything else. Everything below needs
0.15.0 or newer, the version that brought `to11 link`. If `to11` is missing or
older, install or update it first with the `install-cli` skill, and confirm
the version again before going on. A repository can pin an older version
than the person's home, so check from the folder being set up.

## Sign in

`to11 whoami` says whether someone is signed in and which organizations they
belong to. If nobody is, the person signs in with `to11 login`. In Claude Code
they can try `! to11 login` at the prompt. If the CLI answers that it cannot
sign in from here, they run `to11 login` in a terminal of their own and come
back. Signing in is the one step that may need that.

## Link the folder

`to11 link` writes the configuration and offers the to11 plugin. Inside a repository it links the repository. With `--global` it links
the person's home instead. Inside a repository, ask which one they want first.
A repository's configuration is committed and applies to everyone who works in
it, on top of each person's own.

Run under you, `to11 link` never prompts. It either finishes, or it stops with
an `action_required` answer naming what is missing:

- **With `choices` and `next`:** put the choices to the person, one question at
  a time. Mark a choice the CLI matched to the folder's name as the likely
  one. Then run the `next` command for the choice they made. Never pick for
  them when there is more than one choice.
- **With `ask`:** relay the message to the person, wait until they say it is
  done, and run the same command again.

Repeat until it finishes, then sync, which installs the skills. Each answer settles one thing: the organization,
then the project, then the environment the skills follow. `prod` is the usual
environment.

The `next` commands accept the defaults. These are the targets for the agents
detected on this machine, and the to11 plugin for each of them. Before running
one, tell the person what it will set up. Add `--target` if they want skills
in another folder, and `--no-plugin` if they do not want the plugin.

On a folder that is already linked, show the person what is configured before
changing anything. Pins and disables are lines in the configuration file. The
`manage-skills` skill covers those.

## Route Claude Code through to11

This is optional. Ask whether the person wants their Claude Code sessions to
show up in to11.

If they do, `to11 code claude` starts a routed session. On its first run it
routes through the first project the folder is linked to. If that project has
no provider for it, it creates one, which everyone in the project can see. Tell
the person this before they start.

If they want a different project, environment or provider, the CLI can list
each of them. A provider of kind `anthropic`, live in the chosen environment and
holding passthrough credentials only, is one Claude Code can use. Creating a
provider is visible to the whole project, so do it only after the person
agrees. The choice is saved in `code.claude.yaml` next to the folder's
`skills.yaml`. The
[configuration reference](https://to11.ai/docs/reference/cli/configuration)
lists its keys.

Routing applies from the next session started with `to11 code claude`, not to
this one.

## Show that it worked

Before you report success, `to11 skill list --format json` must show the
person's skills as installed.

- `no-label` means nothing is published to that environment yet.
- `shadowed`, `conflict` and `dirty` mean something already in a skills folder
  is in the way. Ask before forcing anything over it.

In a repository, the configuration under `.to11/` is meant to be committed. The
state files beside it, `.skills.state.json` and `.skills.state.conflict.*.json`,
must stay out of commits. If nothing ignores them yet, add that.

Tell the person what was written and where. Leave the commit to them unless
they ask.

New skills reach Claude Code at the next session start, or at the next prompt
once the plugin's refresh points run.

## Without a person

In CI, a container or a provisioning script, nobody signs in. Provide an API
key in the environment as `TO11_API_KEY`, and link with every value given as
a flag, so nothing is left to choose.

The key is created in the to11 dashboard under **Settings → API keys** and is
shown once. It comes from a secret store. It must never be written into a
script, a file in the repository, or a command line, where it would reach shell
history and the environment of everything the script starts. Do not ask the
person to paste it into this conversation.

A signed-in person always wins over `TO11_API_KEY`.
