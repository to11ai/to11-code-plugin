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
to11 skill list                # every skill, its version, and its state here
to11 skill list --format json  # the same, for a program to read
```

`list` gives each skill one word for its state on this machine. `in-sync` is
installed and current. `out-of-sync` is installed and behind what the label
publishes. `pending` is published and not here yet. `changed` means the
files on disk differ from what was delivered. `unmanaged` is something in the
skills directory that to11 did not put there and will never touch.

An `out-of-sync` or `pending` row is what `to11 skill sync` fixes.

## Change one

A skill is a folder. The entry document is `SKILL.md`; anything beside it is a
reference file the entry document can link to.

```bash
to11 skill store <slug> --dir ./my-skill        # publish a new version from a folder
to11 skill store <slug> --from ./SKILL.md       # …or a single file
to11 skill store <slug> --from -                # …or stdin
to11 skill store <slug> --body '<text>'         # …or inline, for a one-liner
```

Storing a slug the project does not have **creates** it, and the output says
`created` rather than `stored` — which is how a typo announces itself. A new
skill needs `--description`, because an agent decides from the description
whether a skill is relevant.

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
