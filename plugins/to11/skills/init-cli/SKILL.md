---
name: init-cli
description: Configure the to11 CLI against a to11 project so this machine receives the company's skills. Use after installing the CLI, when a to11 command reports that nothing is configured, or when someone asks how to connect this machine or this repository to to11.
---

`to11 init` configures one location and runs a first sync. It needs two things
that come from the dashboard, and it asks for one of them at a hidden prompt.

If `to11` is not on `PATH`, install it first — the `install-cli` skill covers
that.

## Get an API key

In the to11 dashboard:

1. Open the project this machine should receive skills from. If there is none,
   create it; `init` does not create projects or environments.
2. Go to **Settings → API keys** and create a key.
3. Copy it. It is shown once.

The key is never passed as a flag. There is no flag that takes it, so no
command line can carry it by accident.

## Configure this machine

```bash
to11 init
```

It asks for the key at a hidden prompt, then walks through what it needs:
which project, which label to follow, where skills should land, and whether
delivered directories carry a name in front. Every question but the key has a
default, so the rest is answerable with return presses. Re-running offers
whatever is already configured, and naming a second project adds it rather
than replacing the first.

It finishes by syncing, and says what it installed.

## Configure a repository

To decide which skills apply to work in one repository, run it there and
choose the repository:

```bash
to11 init --location repo
```

That writes `<repo>/.to11/skills.yaml`, which is committed. A developer's own
configuration still applies at the same time — a repository adds skills for
work done in it, and never changes how a colleague's agent behaves.

## Configure without a terminal

For CI or a provisioning script, supply the flags and `init` asks nothing:

```bash
to11 init --project <workspace/project> --label <label>
```

With no terminal there is no prompt, so the key comes from `TO11_API_KEY` in
the environment. Inject it from a secret store rather than writing it into the
script: a value on a command line reaches the shell history and the
environment of everything that script starts.

## Check what arrived

```bash
to11 skill list
```

One row per skill, with its version, its state on this machine, and where it
came from. A skill the configuration names but that did not arrive is a row
too, and its state is the reason.
