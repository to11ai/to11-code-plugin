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
belong to. If nobody is, run `to11 login` yourself. It opens the person's
browser, and they finish the sign-in there. If the CLI answers that it cannot
sign in from here, the person runs `to11 login` in a terminal of their own and
comes back. Signing in is the one step that may need that.

## Link the folder

`to11 link` writes the configuration and offers the to11 plugin. Inside a
repository it links the repository. With `--global` it links the person's
home instead. Inside a repository, ask which one they want first. A
repository's configuration is committed and applies to everyone who works in
it, on top of each person's own.

Run under you, `to11 link` never prompts. It either finishes, or it exits with
one `action_required` object on stdout and writes nothing. Its `reason` says
what is missing. Resolve that, run link again, and repeat until it finishes.
Then sync, which installs the skills.

On a folder that is already linked, show the person what is configured before
changing anything. Pins and disables are lines in the configuration file. The
`manage-skills` skill covers those.

### Something to choose

These come with `choices` and a `next` command for each. Put the choices to
the person as one question. Run the `next` command for the one they pick. When
there is more than one choice, never pick for them.

| `reason`               | What the person decides                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `missing_organization` | Which of their organizations the folder belongs to.                                                                                            |
| `missing_project`      | Which project the skills come from. A choice marked `matched: directory name` fits the folder's name, so offer it as the likely one.           |
| `missing_label`        | Which label the skills follow. A label says which released version of each skill arrives; `prod` is the usual one. This is asked only when the project offers several labels and none is `prod`. |

Some CLI messages call a label an "environment". It is the same choice: the
configuration key and the flag are both `label`.

If the `message` opens by naming a value that cannot be read, the value
given was mistyped or the person has no access to it. Say which value, and
offer the `choices`, which hold only what they can read.

### Something only a person can do

These come with an `ask` and no command that finishes the work. Do not work
around them. Relay `ask.message` to the person, and `ask.url` when there is
one. Run link again once they say it is done.

| `reason`          | What has to happen                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `not_signed_in`   | The person signs in, as above.                                                                                                        |
| `no_organization` | They belong to no organization. Someone at their company has to invite them.                                                          |
| `no_projects`     | The organization has no project they can read. An admin has to give them access or create a project.                                 |
| `no_environments` | The chosen project has no label to follow yet. Someone sets one up in the dashboard, or the person picks another project.             |

`missing_organization` and `missing_project` also come as an `ask` when none of
the projects on offer has a label to follow. Treat that like `no_environments`.

Anything other than `action_required` is an error, not a question. Show it to
the person rather than retrying.

### Before running a `next` command

The `next` commands accept the defaults. These are the targets for the agents
detected on this machine, and the to11 plugin for each of them. Before running
one, tell the person what it will set up. Add `--target` if they want skills
in another folder, and `--no-plugin` if they do not want the plugin.

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

- `no-label` means nothing is released to that label yet.
- `shadowed`, `conflict` and `dirty` mean something already in a skills folder
  is in the way. Ask before forcing anything over it.

In a repository, the configuration under `.to11/` is meant to be committed. The
state files beside it, `.skills.state.json` and `.skills.state.conflict.*.json`,
must stay out of commits. If nothing ignores them yet, add that.

Tell the person what was written and where. Leave the commit to them unless
they ask.

New skills reach Claude Code at the next session start, or at the next prompt
once the plugin's refresh points run.
