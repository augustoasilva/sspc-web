// Proof that the ESLint rules of eslint.config.mjs fire on boundary and component
// violations and stay silent on allowed code (research R-13, T029). Inline code at
// virtual paths, so the file-scoped overrides apply and no fixture file exists.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eslint = new ESLint({ cwd: root });

async function ruleIds(code, virtualPath) {
  const [result] = await eslint.lintText(code, { filePath: path.join(root, virtualPath) });
  return result.messages.map((message) => message.ruleId);
}

const COMPONENT_OK = `import { Component } from '@angular/core';
@Component({ selector: 'sspc-x', template: '' })
export class X {}
`;

describe('eslint boundary and component rules', () => {
  it.each([
    {
      name: 'given a ui file importing core, when linted, then no-restricted-imports fires',
      input: { path: 'src/app/ui/button/x.ts', code: "import { Foo } from '@sspc/core/x';\nexport const y = Foo;\n" },
      output: { ruleId: 'no-restricted-imports' },
    },
    {
      name: 'given a ui file importing @angular/router, when linted, then no-restricted-imports fires',
      input: { path: 'src/app/ui/button/x.ts', code: "import { Router } from '@angular/router';\nexport const r = Router;\n" },
      output: { ruleId: 'no-restricted-imports' },
    },
    {
      name: 'given a ui file importing two levels up, when linted, then no-restricted-imports fires',
      input: { path: 'src/app/ui/button/x.ts', code: "import { z } from '../../x';\nexport const q = z;\n" },
      output: { ruleId: 'no-restricted-imports' },
    },
    {
      name: 'given a feature importing a sibling feature route, when linted, then no-restricted-imports fires',
      input: { path: 'src/app/features/home/pages/x.ts', code: "import { r } from '../../../about/about.routes';\nexport const s = r;\n" },
      output: { ruleId: 'no-restricted-imports' },
    },
    {
      name: 'given core importing a feature, when linted, then no-restricted-imports fires',
      input: { path: 'src/app/core/x.ts', code: "import { f } from '@sspc/features/x';\nexport const g = f;\n" },
      output: { ruleId: 'no-restricted-imports' },
    },
    {
      name: 'given a component with an explicit Default change detection, when linted, then prefer-on-push fires',
      input: {
        path: 'src/app/ui/x/x.ts',
        code: "import { ChangeDetectionStrategy, Component } from '@angular/core';\n@Component({ selector: 'sspc-x', template: '', changeDetection: ChangeDetectionStrategy.Default })\nexport class X {}\n",
      },
      output: { ruleId: '@angular-eslint/prefer-on-push-component-change-detection' },
    },
    {
      name: 'given a non-standalone component, when linted, then prefer-standalone fires',
      input: {
        path: 'src/app/ui/x/x.ts',
        code: "import { Component } from '@angular/core';\n@Component({ selector: 'sspc-x', template: '', standalone: false })\nexport class X {}\n",
      },
      output: { ruleId: '@angular-eslint/prefer-standalone' },
    },
    {
      name: 'given a template with *ngIf, when linted, then prefer-control-flow fires',
      input: { path: 'src/app/ui/x/x.html', code: '<div *ngIf="a"></div>\n' },
      output: { ruleId: '@angular-eslint/template/prefer-control-flow' },
    },
    {
      name: 'given a ui file importing one level up inside ui, when linted, then no-restricted-imports stays silent',
      input: { path: 'src/app/ui/banner/x.ts', code: "import { B } from '../button/button';\nexport const b = B;\n" },
      output: { absent: 'no-restricted-imports' },
    },
    {
      name: 'given a feature importing its own route file, when linted, then no-restricted-imports stays silent',
      input: { path: 'src/app/features/home/pages/x.ts', code: "import { r } from '../home.routes';\nexport const s = r;\n" },
      output: { absent: 'no-restricted-imports' },
    },
    {
      name: 'given a component that omits changeDetection, when linted, then no change-detection message fires',
      input: { path: 'src/app/ui/x/x.ts', code: COMPONENT_OK },
      output: { absent: '@angular-eslint/prefer-on-push-component-change-detection' },
    },
  ])('$name', async ({ input, output }) => {
    // given / when
    const rules = await ruleIds(input.code, input.path);
    // then
    if (output.ruleId) expect(rules).toContain(output.ruleId);
    if (output.absent) expect(rules).not.toContain(output.absent);
  });
});
