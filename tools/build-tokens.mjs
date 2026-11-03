#!/usr/bin/env node
// Builds the design tokens from the YAML front matter of DESIGN.md (research R-09).
// Outputs: src/app/ui/tokens/tokens.json (W3C format), src/app/ui/tokens/tokens.css
// (light on :root, dark under the media query) and site/assets/css/tokens.css for the static
// site (the same light and dark values; the site follows the device like the app). Never edit the outputs by hand.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const defaults = {
  designPath: path.join(root, 'DESIGN.md'),
  tokensJson: path.join(root, 'src/app/ui/tokens/tokens.json'),
  tokensCss: path.join(root, 'src/app/ui/tokens/tokens.css'),
  siteCss: path.join(root, 'site/assets/css/tokens.css'),
};

const DIMENSION = /^-?\d+(\.\d+)?(px|rem)$/;

function sortObject(object) {
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, object[key]]));
}

export function readFrontMatter(designPath) {
  // A Windows checkout (core.autocrlf) writes CRLF; the front matter is read as LF.
  const text = readFileSync(designPath, 'utf8').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${designPath}: no YAML front matter`);
  return parse(match[1]);
}

// Builds the W3C-format token tree from the parsed design.
export function buildTokenTree(design) {
  const colors = design.colors ?? {};
  const light = {};
  const dark = {};
  for (const [name, value] of Object.entries(colors)) {
    if (name.startsWith('dark-')) dark[name.slice(5)] = { $type: 'color', $value: String(value) };
    else light[name] = { $type: 'color', $value: String(value) };
  }

  const typography = {};
  for (const [name, scale] of Object.entries(design.typography ?? {})) {
    const { fontVariation, ...w3c } = scale;
    typography[name] = { $type: 'typography', $value: { ...w3c, ...(fontVariation ? { fontVariation } : {}) } };
  }

  const dimensions = (group) => {
    const out = {};
    for (const [name, value] of Object.entries(group ?? {})) {
      out[name] = { $type: 'dimension', $value: String(value) };
    }
    return sortObject(out);
  };

  // Dimension properties of components: height, size, padding, and so on.
  const component = {};
  for (const [name, props] of Object.entries(design.components ?? {})) {
    for (const [prop, value] of Object.entries(props)) {
      if (DIMENSION.test(String(value))) {
        component[`${name}-${prop}`] = { $type: 'dimension', $value: String(value) };
      }
    }
  }

  // Derived stroke, focus and elevation tokens (research R-09, G11): written over
  // spacing-base so no literal px appears. A design that defines these groups wins.
  const base = 'var(--sspc-spacing-base)';
  const derivedStroke = {
    hairline: `calc(${base} * 0.25)`,
    focus: `calc(${base} * 0.5)`,
  };
  const derivedFocus = { offset: `calc(${base} * 0.5)` };
  const derivedElevation = { floating: `0 calc(${base} * 2) calc(${base} * 6) rgba(0, 0, 0, 0.35)` };
  const pick = (group, derived) => {
    const out = {};
    for (const [name, value] of Object.entries(derived)) {
      out[name] = { $type: 'dimension', $value: String(group?.[name] ?? value) };
    }
    return sortObject(out);
  };

  return sortObject({
    color: sortObject(light),
    dark: sortObject(dark),
    typography: sortObject(typography),
    rounded: dimensions(design.rounded),
    spacing: dimensions(design.spacing),
    component: sortObject(component),
    stroke: pick(design.stroke, derivedStroke),
    focus: pick(design.focus, derivedFocus),
    elevation: pick(design.elevation, derivedElevation),
  });
}

// Style Dictionary custom format: the CSS variables block, light and dark.
function cssLines(tree, { includeDark }) {
  const rootVars = [];
  const darkVars = [];
  const typeClasses = [];
  for (const [group, tokens] of Object.entries(tree)) {
    if (group === 'typography') {
      for (const [name, token] of Object.entries(tokens)) {
        const v = token.$value;
        const lines = [
          `  font-family: "${v.fontFamily}", system-ui, sans-serif;`,
          `  font-size: ${v.fontSize};`,
          `  font-weight: ${v.fontWeight};`,
          `  line-height: ${v.lineHeight};`,
        ];
        if (v.letterSpacing) lines.push(`  letter-spacing: ${v.letterSpacing};`);
        if (v.fontVariation) lines.push(`  font-variation-settings: ${v.fontVariation};`);
        typeClasses.push(`.type-${name} {\n${lines.join('\n')}\n}`);
      }
    } else if (group === 'color') {
      for (const [name, token] of Object.entries(tokens)) rootVars.push(`  --sspc-color-${name}: ${token.$value};`);
    } else if (group === 'dark') {
      for (const [name, token] of Object.entries(tokens)) darkVars.push(`    --sspc-color-${name}: ${token.$value};`);
    } else {
      for (const [name, token] of Object.entries(tokens)) rootVars.push(`  --sspc-${group}-${name}: ${token.$value};`);
    }
  }
  const blocks = [
    `:root {\n  color-scheme: light dark;\n${rootVars.join('\n')}\n}`,
  ];
  if (includeDark) {
    blocks.push(`@media (prefers-color-scheme: dark) {\n  :root {\n${darkVars.join('\n')}\n  }\n}`);
    // A scoped wrapper (the catalogue's opposite-theme sections) sets data-theme and gets the
    // colors of that theme only. Spacing, shape and type stay on :root.
    const lightColorVars = rootVars.filter((line) => line.includes('--sspc-color-'));
    blocks.push(`[data-theme="light"] {\n${lightColorVars.join('\n')}\n}`);
    blocks.push(`[data-theme="dark"] {\n${darkVars.map((line) => line.slice(2)).join('\n')}\n}`);
  }
  return [...blocks, ...typeClasses].join('\n\n') + '\n';
}

async function renderCss(tree, { includeDark, destination }) {
  const sd = new StyleDictionary({
    log: { verbosity: 'silent' },
    tokens: tree,
    hooks: {
      formats: {
      'sspc/css': ({ dictionary }) => {
        const grouped = {};
        for (const token of dictionary.allTokens) {
          const [group, ...rest] = token.path;
          grouped[group] ??= {};
          grouped[group][rest.join('-')] = { $value: token.$value };
        }
        return cssLines(grouped, { includeDark });
      },
      },
    },
    platforms: {
      css: {
        buildPath: `${path.dirname(destination)}/`,
        files: [{ destination: path.basename(destination), format: 'sspc/css' }],
      },
    },
  });
  await sd.buildAllPlatforms();
  return readFileSync(destination, 'utf8');
}

export async function buildTokens(options = {}) {
  const paths = { ...defaults, ...options };
  const design = readFrontMatter(paths.designPath);
  const tree = buildTokenTree(design);

  mkdirSync(path.dirname(paths.tokensJson), { recursive: true });
  writeFileSync(paths.tokensJson, JSON.stringify(tree, null, 2) + '\n');

  // Build the app stylesheet and the site stylesheet through Style Dictionary, in
  // a scratch directory, and then write the files at their final paths.
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const scratch = mkdtempSync(path.join(tmpdir(), 'sspc-sd-'));
  try {
    const appCss = await renderCss(tree, { includeDark: true, destination: path.join(scratch, 'app.css') });
    const siteCss = await renderCss(tree, { includeDark: true, destination: path.join(scratch, 'site.css') });
    mkdirSync(path.dirname(paths.tokensCss), { recursive: true });
    writeFileSync(paths.tokensCss, appCss);
    mkdirSync(path.dirname(paths.siteCss), { recursive: true });
    writeFileSync(paths.siteCss, siteCss);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return paths;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = await buildTokens();
  console.log(`tokens: wrote ${path.relative(root, out.tokensJson)}, ${path.relative(root, out.tokensCss)}, ${path.relative(root, out.siteCss)}`);
}
