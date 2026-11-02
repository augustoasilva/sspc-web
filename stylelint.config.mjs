/** @type {import('stylelint').Config} */
export default {
  files: ['src/app/ui/**/*.scss'],
  customSyntax: 'postcss-scss',
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color'],
    'unit-disallowed-list': ['px', 'rem', 'em', 'pt', 'pc', 'cm', 'mm', 'in'],
    'declaration-property-value-disallowed-list': {
      'font-family': ['/^(?!var\\().+/'],
    },
  },
};
