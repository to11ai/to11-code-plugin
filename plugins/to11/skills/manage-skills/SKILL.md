---
name: manage-skills
description: See and change the skills this project publishes — list what exists, read one, create or update one, release it — from a session, without a browser.
---

Skills in this project are to11 prompts released on a label. `to11 skill sync`
installs every skill that label publishes onto this machine, so a change
published once reaches every developer without anyone copying a file.

You can see and change them from here. A browser is not required.

## See what exists

```bash
to11 skill sync                # install whatever the project publishes now
to11 skill list --format json  # every skill and its state on this machine
```

Read the JSON, not the table. For each skill, `installedVersion` is the version
on this machine, `resolvedVersion` the one your configuration asks for, and
`labelVersion` the one the label publishes. `tracking` says whether the
configuration follows the label or pins a version. `changedFiles` lists files
on disk that differ from what was delivered.

A missing `installedVersion`, or one that differs from `resolvedVersion`, is
what `to11 skill sync` fixes. A row with only a path and a `state` is something
in a skills directory that to11 did not put there and will never touch.

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

## Nobody else sees it until you release it

`store` writes a version and moves no label, so it reaches nobody. The version
lands on this machine so you can read what you just wrote, and it is pinned in
your configuration so the next sync leaves it alone.

```bash
to11 skill release <slug>      # move the label to the stored version
```

That is the one command other people feel.

## Turning one off

Which skills you receive, and which version, are lines in your own
configuration — not commands:

```yaml
projects:
  - project: workspace/project
    label: live
    skills:
      noisy-skill: { disabled: true }   # never delivered here
      careful-skill: { version: 4 }     # held at 4, whatever the label moves to
```

Edit the file and run `to11 skill sync`. A disable always wins, in every scope.
