// ESLint flat config (constitution Principles III and IV; research R-13).
// Every config object is scoped with `files`, so the .mjs tools, scripts and site files that
// live outside `src/` are matched by no rule. Node globals are therefore not needed.
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

const uiMessage =
  'ui components may import only Angular, the Angular CDK, Lucide and the design tokens, and a ' +
  'sibling ui component by a one-level relative path (constitution Principle IV).';

export default defineConfig([
  globalIgnores(['dist/', '.angular/', 'node_modules/', 'coverage/']),

  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended, tseslint.configs.stylistic, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'sspc', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sspc', style: 'camelCase' },
      ],
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },

  {
    files: ['src/**/*.html'],
    extends: [angular.configs.templateRecommended],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },

  // Boundaries (Principle IV). The paths below are matched by `no-restricted-imports`.
  {
    files: ['src/app/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@sspc/core', '@sspc/core/**'], message: uiMessage },
            { group: ['@sspc/features', '@sspc/features/**'], message: uiMessage },
            { group: ['@angular/router', '@angular/router/**'], message: uiMessage },
            { group: ['@angular/common/http', '@angular/common/http/**'], message: uiMessage },
            { group: ['dexie', 'dexie/**'], message: uiMessage },
            { group: ['../../**'], message: uiMessage },
          ],
        },
      ],
    },
  },
  {
    // One override for every feature directory, present and future: a feature has no alias, so
    // another feature or anything outside the feature can only be reached through `../../`.
    files: ['src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../**'],
              message:
                'A feature may import ui and core through aliases, never another feature or ' +
                'anything outside itself by a relative path (constitution Principle IV).',
            },
            {
              group: ['@sspc/features', '@sspc/features/**'],
              message: 'A feature must not import another feature (constitution Principle IV).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sspc/features', '@sspc/features/**', '**/features/**'],
              message: 'core must not import features (constitution Principle IV).',
            },
          ],
        },
      ],
    },
  },
]);
