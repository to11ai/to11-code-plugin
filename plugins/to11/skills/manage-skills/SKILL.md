---
name: manage-skills
description: See and change the skills this project publishes — list what exists, read one, create or update one — from a session, without a browser.
---

Skills in this project are to11 prompts. Each has one label, `latest`, which
is its newest stored version. `to11 skill sync` installs onto this machine what
your configuration follows, so a change stored once reaches every developer
without anyone copying a file.

You can see and change them from here. A browser is not required.

## See what exists

```bash
to11 skill sync                # install whatever the project publishes now
to11 skill list --format json  # every skill and its state on this machine
```

Read the JSON, not the table. For each skill, `installedVersion` is the version
on this machine, `resolvedVersion` the one your configuration asks for, and
`labelVersion` the one `latest` is. `tracking` is `label` when the
configuration follows `latest` and `pinned` when it holds a version.
`changedFiles` lists files on disk that differ from what was delivered.

A missing `installedVersion`, or one that differs from `resolvedVersion`, is
what `to11 skill sync` fixes. A row whose `state` is `available` is a skill the
project has and your configuration does not name; `to11 link` adds it. A row
with only a path and a `state` is something in a skills directory that to11 did
not put there and will never touch.

## Change one

A skill is a folder. The entry document is `SKILL.md`; anything beside it is a
reference file the entry document can link to.

Storing goes through the `import-skill` skill: it checks a new skill or a new
version, written here or brought in from elsewhere, and then stores it with
`to11 skill store`. `store` installs the version on this machine straight away,
and every agent that loads it acts on what it says.

The whole folder is the truth: a file that was in the previous version and is
absent from this one is gone from the new one. That is the only way to remove a
reference file.

## Storing is publishing

`store` makes the new version `latest`, so everyone who receives the skill and
follows `latest` gets it on their next sync. There is no draft and no separate
release step, and the CLI cannot take a version back. Store only what the
person has decided to send.

The version also lands on this machine, pinned in your configuration, so your
machine keeps it while later stores move `latest` on. Remove the `version:`
line to follow `latest` again.

A slug the project does not have is created, and the output says `created`
rather than `stored`; for an update, that means the slug is wrong. A created
skill arrives on the next sync wherever a project entry follows the whole
project. An entry that names its skills shows it as `available`, and it arrives
there only once someone adds it with `to11 link`.

## Turning one off

Which skills you receive, and which version, are lines in your own
configuration — not commands:

```yaml
projects:
  - project: workspace/project
    label: latest
    skills:
      noisy-skill: { disabled: true }   # never delivered here
      careful-skill: { version: 4 }     # held at 4, whatever latest moves to
```

Edit the file and run `to11 skill sync`. A disable decides the directories of
the file it is in: one in `~/.to11/skills.yaml` keeps the skill out of your
home, and a repository that asks for it still installs it there. Add
`enforced: true` beside it to keep it out of every repository too.
