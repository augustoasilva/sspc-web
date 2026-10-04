# Typed Branches preset

Creates `{type}/{number}-{slug}` branches automatically when invoking `speckit.specify` (in this Codex project, `$speckit-specify`). Uses the official Git extension's mandatory `before_specify` hook and documented `GIT_BRANCH_NAME` override. No core scripts are modified.

Types follow [Conventional Branch 1.1.0](https://conventionalbranch.org/): `feature` (alias `feat`), `bugfix` (alias `fix`), `hotfix`, `release`, and `chore`. The agent infers the purpose and defaults to `feature`. Supply `type=fix` or another supported prefix to choose explicitly. Source prefixes `ai`, `claude`, `codex`, `copilot`, and `cursor` are supported when explicitly requested. Commit types such as `docs` and `ci` are not branch prefixes here; documentation and dependency maintenance use `chore`.

One sequential counter covers every type: `feature/001-user-auth`, `feature/002-analytics`, `bugfix/003-payment-timeout`. The next number is the highest existing sequential number plus one, including local/remote branches and `specs/` directories. Slugs come from the user's suggested name or the agent's concise suggestion. Specs remain at `specs/003-payment-timeout`, with `.specify/feature.json` used by downstream commands. Names use lowercase letters and digits with single separators and no leading/trailing separators; release version dots are supported, e.g. `release/004-v1.2.0`.

## Install

From the initialized project's root:

```bash
specify extension add git
specify preset add --dev ./presets/typed-branches
```

In `.specify/extensions/git/git-config.yml`, keep:

```yaml
branch_numbering: sequential
branch_template: ""
branch_prefix: ""
```

In `.specify/extensions.yml`, keep `hooks.before_specify` enabled, unconditional, and mandatory (`optional: false`) with command `speckit.git.feature`. Only this hook is needed for this preset.

Example requests:

```text
$speckit-specify Add user authentication
$speckit-specify Fix payment processing timeout type=fix
```

An explicitly supplied `GIT_BRANCH_NAME` or `SPECIFY_FEATURE_DIRECTORY` remains supported. An exact branch override must follow the preset's `{type}/{number}-{slug}` convention and bypasses automatic number allocation.

Preset installation copies these source files and materializes the commands into the active integration. After editing the source, reinstall with:

```bash
specify preset update typed-branches --dev ./presets/typed-branches
```

This preset uses the Bash Git extension script, as configured in this project. Numbers cannot remember work after both its branch and numbered spec have been deleted. Remote discovery follows the extension's behavior: unreachable remotes are ignored, so numbering then depends on locally known branches and specs.

## Official references

- [Preset installation, composition, and command overrides](https://github.com/github/spec-kit/blob/main/docs/reference/presets.md)
- [Preset manifest scaffold](https://github.com/github/spec-kit/blob/main/presets/scaffold/preset.yml)
- [Git extension hook declaration](https://github.com/github/spec-kit/blob/main/extensions/git/extension.yml)
- [Git feature command and exact branch override](https://github.com/github/spec-kit/blob/main/extensions/git/commands/speckit.git.feature.md)
