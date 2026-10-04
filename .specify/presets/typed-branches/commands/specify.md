---
description: "Create a specification and a type/NNN-slug branch with global sequential numbering."
---

## Typed Branches Preset

Apply these amendments to the core workflow below:

- The mandatory `before_specify` hook invokes `speckit.git.feature`. Pass the full feature description, any explicit `type=<type>` or suggested short name, and any explicitly supplied `GIT_BRANCH_NAME` to that hook. The installed Typed Branches override creates and switches to the branch. If the hook is missing, disabled, conditional, or fails, stop and explain how to restore the unconditional mandatory hook; do not report successful branch creation or create a specification without the branch.
- After the hook succeeds, retain its `BRANCH_NAME` and `FEATURE_NUM` JSON values.
- When the user has not supplied `SPECIFY_FEATURE_DIRECTORY`, set it to `specs/<final branch segment>` before the core directory-resolution step. For example, `bugfix/003-payment-timeout` uses `specs/003-payment-timeout`. Use the number already allocated by the hook; do not allocate another number by scanning only specs. If that directory already exists, stop and report the collision; do not overwrite an existing specification.
- Preserve explicitly supplied `SPECIFY_FEATURE_DIRECTORY`. Create and populate the spec and persist `.specify/feature.json` through the core workflow below.
- Include the actual branch name in the completion report.

{CORE_TEMPLATE}
