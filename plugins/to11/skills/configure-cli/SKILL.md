---
name: configure-cli
description: Set up the to11 CLI from inside this session so the person receives their company's skills in Claude Code and Codex and, optionally, routes Claude Code through to11. Use after installing the CLI, when a to11 command reports that nothing is configured, or when someone asks to set up to11 in their home or in a repository.
---

Set to11 up here, in the conversation. You link the folder to a project, put
each open choice to the person, and show that skills arrive. The person only
signs in.

If the person asks how else to set it up, `to11 ui` is the manual way: a
screen of its own in a terminal, outside any coding agent. Do not offer it
otherwise.

## Before you start

Check the installed version before anything else. Everything below needs
0.33.0 or newer. If `to11` is missing or older, install or update it first
with the `install-cli` skill, and confirm the version again before going on.
A repository can pin an older version than the person's home, so check from
the folder being set up.

## Sign in

`to11 whoami` says whether someone is signed in and which organizations they
belong to. If nobody is, run `to11 login`. Run by an agent, it answers
`not_signed_in` instead of signing in. Then the person runs `to11 login` in a
terminal of their own, finishes in the browser it opens, and comes back. Check
with `to11 whoami` before going on.

## Start from what is there

Inside a repository, ask whether to set up the repository or the person's home.
A repository's configuration is committed and applies to everyone who works in
it, on top of each person's own. Outside a repository it is the home.

If that location is already linked, show the person what its configuration
says before changing anything. Pins and disables are lines in that file. The
`manage-skills` skill covers them.

Skills follow one label, `latest`: each skill's newest stored version. A file
that names any other label stops every to11 command, `link` included, with an
error naming the line. Change that label to `latest` once the person agrees.
A pinned `version:` keeps a skill where it is.

## Link the folder

`to11 link` writes the location's configuration. With `--global` it links the
person's home from inside a repository. Run by an agent, it never prompts. It
either finishes, or it exits with one `action_required` object on stdout. The
object's `reason` names what is missing. Resolve that, run link again, and
repeat until it finishes.

### Something to choose

These come with `choices` and a `next` command for each. Put the choices to
the person as one question, then run the `next` command for the one they pick.
When there is more than one choice, never pick for them.

| `reason`               | What the person decides                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `missing_organization` | Which of their organizations the folder belongs to.                                                                            |
| `missing_project`      | Which project the skills come from. A choice marked `matched: directory name` fits the folder's name, so offer it as the likely one. |

If the `message` opens by naming a value that cannot be read, the value given
was mistyped or the person has no access to it. Say which value, and offer the
`choices`, which hold only what they can read.

### Skills already in the folder

`unmanaged_skills` means the skills folders already hold skills that to11 did
not deliver. The configuration is written by then, and nothing else is. Each
choice is one folder, and each `next` command is one outcome for one folder.
Its `when` says what that outcome does. Put each folder to the person, with the
outcomes it offers:

- **Adopt:** the folder is the published version, and to11 manages it from now
  on. Nothing is uploaded.
- **Keep:** the folder stays as it is, and the published skill is not
  delivered here.
- **Take:** the published version replaces the folder, and the files in the
  folder now are deleted.
- **Upload:** the folder is stored in the project as its newest version.
  Everyone who receives that skill gets it on their next sync, and the CLI
  cannot take a version back. Upload only what the person has decided to
  publish. Check the folder with the `import-skill` skill's checks first, but
  do not copy or store it the way that skill goes on to. The upload `next`
  command is the one store.
- **Skip:** every folder stays as it is, and the sync reports them as
  conflicts.

Once every folder has an answer, the link is done. Go on to the sync.

### Something only a person can do

These come with an `ask` and no command that finishes the work. Do not work
around them. Relay `ask.message` to the person, and `ask.url` when there is one.
Run link again once they say it is done.

| `reason`          | What has to happen                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `not_signed_in`   | The person signs in, as above.                                                                        |
| `no_organization` | They belong to no organization. Someone at their company has to invite them.                         |
| `no_projects`     | The organization has no project they can read. An admin has to give them access or create a project. |

Anything other than `action_required` is an error, not a question. Show it to
the person rather than retrying.

### Before running a `next` command

A `next` command accepts the defaults with `--yes`. Tell the person what it
will set up, and change it to match what they want:

- **Targets:** a skills folder for each agent detected on this machine.
  `--target` names the folders instead, once per folder.
- **The to11 plugin:** installed for each detected agent. `--no-plugin` leaves
  it out.
- **Which skills:** every skill the project has, and every one stored in it
  later. `--skill` names the only ones to receive. `--new-skills` or
  `--no-new-skills` says whether skills stored later arrive as well.
- **Auto-sync:** off unless the person turns it on, because `--yes` never does.
  On, the plugin sends each Claude Code session to the project after every
  response. Ask, then pass `--auto-sync` or `--no-auto-sync`. The setting is the
  person's own and stays out of git.

Once link finishes, run `to11 skill sync`. That installs the skills.

## Route Claude Code through to11

This is optional. Ask whether the person wants their Claude Code sessions to
show up in to11.

If they do, `to11 code claude` starts a routed session. Its first run routes
through the first project the configuration names. If that project has no
`anthropic-to11-cli` provider, the run creates one, which everyone in the
project can see. Tell the person this before they start. The person runs
`to11 code claude` themselves, as the way they start Claude Code from then on.
Never run it from this session: it starts another Claude Code.

If they want a different project, environment or provider, the CLI lists each
of them. A provider of kind `anthropic`, live in the chosen environment and
holding passthrough credentials only, is one Claude Code can use. Creating a
provider is visible to the whole project, so do it only after the person
agrees. The choice is saved in `code.claude.yaml` next to the location's
`skills.yaml`. The
[configuration reference](https://to11.ai/docs/reference/cli/configuration)
lists its keys.

Routing applies from the next session started with `to11 code claude`, not to
this one.

## Show that it worked

Before you report success, `to11 skill list --format json` must show every
skill the person chose to receive as installed. For any that is not, the row's
state says why. A folder the person kept or skipped stays as it is: never
force it. Anything else that `--force` would settle replaces or removes files
on disk, so ask before forcing.

In a repository, the configuration under `.to11/` is meant to be committed. The
state files beside it, `.skills.state.json` and `.skills.state.conflict.*.json`,
and `local.yaml` must stay out of commits. If nothing ignores them yet, add
that in `.to11/.gitignore`, so the rule covers only those files in `.to11/` and
not the same names elsewhere in the repository.

Tell the person what was written and where. Leave the commit to them unless
they ask.

New skills reach Claude Code at the next session start, or at the next prompt
once the plugin's refresh points run.
