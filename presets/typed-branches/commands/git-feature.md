---
description: "Create a type/NNN-slug branch using one sequential counter across all work types."
---

## User Input

```text
$ARGUMENTS
```

Create and switch to one branch for this specification. Use the official Git extension script at `.specify/extensions/git/scripts/bash/create-new-feature-branch.sh`. Specification files are created by `speckit.specify` after this hook succeeds.

1. Follow [Conventional Branch 1.1.0](https://conventionalbranch.org/): choose the branch type from the user's explicit `type=<type>` or request. Otherwise infer `feature` for new behavior, `bugfix` for a bug correction, `hotfix` for an urgent production fix, `release` for release preparation, and `chore` for maintenance (including documentation and dependency updates). Default to `feature` if unclear. Accept `feat` and `fix` as aliases when requested. The specification also permits `ai`, `claude`, `codex`, `copilot`, and `cursor` when explicitly requested; do not select a source prefix just because an agent is creating the branch. Reject other types and ask for a supported type. Commit types such as `docs`, `refactor`, `test`, and `ci` are not branch prefixes in this preset.
2. Generate a concise suggested slug of 2–4 words, or use the user's suggested short name. Use lowercase words separated by hyphens. Do not include the type or number in the slug.
3. Require Git and an existing repository. If unavailable, stop with an actionable error. Check `.specify/extensions/git/git-config.yml`: `branch_numbering` must be `sequential`, and `branch_template` and `branch_prefix` must be empty. A namespace would scope the extension's counter to a single type, so stop and explain any conflicting setting. Do not use timestamp mode or pass `--number`.
4. If the user explicitly supplied `GIT_BRANCH_NAME`, require that it follows the pattern in step 6. If valid, preserve that exact override and run the official script once with `--json` and the feature description. Return its JSON without generating a type, number, or slug. Invalid exact names must be corrected before branch creation. An explicit number bypasses automatic number allocation.
5. Otherwise, run the official script with `--json --dry-run --short-name "<slug>" "<feature description>"` and **without** `GIT_BRANCH_NAME`. Parse its JSON. With an empty template/prefix, the extension scans local branches, remote branches, and existing `specs/` directories across all types. It allocates the next number after the highest sequential number, starting at `001` and padding to at least three digits.
6. Prefix the dry-run `BRANCH_NAME` with the chosen type and `/`, for example `bugfix/003-payment-timeout`. Require the full name to match `^(feature|feat|bugfix|fix|hotfix|release|chore|ai|claude|codex|copilot|cursor)/[0-9]{3,}-[a-z0-9]+([.-][a-z0-9]+)*$` and pass `git check-ref-format --branch`. This enforces lowercase letters and digits, single separators, and no leading/trailing separators. Release version dots are permitted (e.g., `release/004-v1.2.0`); preserve them in an explicitly suggested release slug. For that case use the dry-run's `FEATURE_NUM` and the validated version slug, because the official script converts dots to hyphens. Keep the complete name within 244 bytes by shortening only the slug if needed, then revalidate. Set this value as `GIT_BRANCH_NAME` for a second invocation of the official script with `--json "<feature description>"`. This uses the extension's documented exact-name override. The dry-run computes the name; only this second invocation creates a branch. Safely quote all values when constructing shell commands.
7. Return the creation invocation's `BRANCH_NAME` and `FEATURE_NUM`. Stop on errors; do not create another branch or use `--allow-existing-branch` automatically.

Example sequence: `feature/001-user-auth`, `feature/002-analytics`, `bugfix/003-payment-timeout`. Numbers are shared across types and are allocated when work starts. Existing numbered specs preserve the sequence after their branches are deleted; retained branches preserve work without a spec. Work whose numbered branch and spec have both been deleted cannot be counted.
