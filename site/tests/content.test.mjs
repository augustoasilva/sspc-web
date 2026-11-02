// Content check of the static site (T124, FR-033, FR-034, FR-035, SEC-009). It starts nothing: it
// reads a running site image at SITE_URL with fetch and checks the two pages. It is skipped when
// SITE_URL is not set, so the local test run does not need the container. It requests only the
// site's own paths; the link destinations are inspected as text and never requested.
import { beforeAll, describe, expect, it } from 'vitest';

const BASE = process.env.SITE_URL;
const describeWithSite = BASE ? describe : describe.skip;

const HOME_ITEMS = [
  'Edição digital • Em obras',
  'Só Saio Pra Comer',
  'Guia gastronômico',
  'Reviews sinceros de restaurantes em Teresina.',
  'Estamos preparando a mesa. O site chega em breve.',
  'Ver nossos links',
  'Teresina, Piauí',
];

const LINKS_ITEMS = [
  'Só Saio Pra Comer',
  'Reviews sinceros de restaurantes em Teresina, por Ilzy e Augusto.',
  'Instagram',
  'TikTok',
  'Parcerias com marcas',
  'Reviews sinceros não estão abertos para publi.',
  'Projetos com marcas são conteúdo autoral e sempre identificados como publicidade.',
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ABSOLUTE_IN_ATTRIBUTE = /\b(?:src|href|srcset|action|poster|data)="(https?:\/\/[^"]+)"/gi;
const ABSOLUTE_IN_CSS = /url\(\s*['"]?(https?:\/\/[^)'"\s]+)/gi;

// HTML collapses runs of whitespace when it is rendered, so the text checks compare collapsed text.
function collapseWhitespace(html) {
  return html.replace(/\s+/g, ' ');
}

async function get(path) {
  const response = await fetch(new URL(path, BASE), { redirect: 'manual' });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

// The anchors of a page, as { attributes, text }.
function anchors(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    attributes: match[1],
    text: match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  }));
}

function attribute(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? match[1] : null;
}

// The absolute URLs a page loads (attributes and inline CSS), not the anchors' destinations.
function loadedAbsoluteUrls(html) {
  return [...html.matchAll(ABSOLUTE_IN_ATTRIBUTE), ...html.matchAll(ABSOLUTE_IN_CSS)].map(
    (match) => match[1],
  );
}

describeWithSite('site content (SITE_URL)', () => {
  let home;
  let links;

  // Loaded once: every case below reads the same two responses.
  beforeAll(async () => {
    home = await get('/');
    links = await get('/links/');
  });

  it.each(HOME_ITEMS)('home contains "%s"', (item) => {
    expect(home.status).toBe(200);
    expect(collapseWhitespace(home.body)).toContain(item);
  });

  it.each(LINKS_ITEMS)('links page contains "%s"', (item) => {
    expect(links.status).toBe(200);
    expect(collapseWhitespace(links.body)).toContain(item);
  });

  it('the links page loads directly by its address, with or without the slash', async () => {
    const withSlash = await get('/links/');
    expect(withSlash.status).toBe(200);
    expect(withSlash.body).toContain('Parcerias com marcas');
    const withoutSlash = await get('/links');
    expect([200, 301, 302]).toContain(withoutSlash.status);
    if (withoutSlash.status !== 200) {
      expect(withoutSlash.headers.get('location')).toBe('/links/');
    }
  });

  it('the "Ver nossos links" button reaches the links page and the target resolves', async () => {
    const button = anchors(home.body).find((anchor) => anchor.text.includes('Ver nossos links'));
    expect(button).toBeDefined();
    const href = attribute(button.attributes, 'href');
    expect(href).toBe('/links/');
    expect((await get(href)).status).toBe(200);
  });

  it('the links page has exactly three link buttons, in order', () => {
    const buttons = anchors(links.body).filter((anchor) =>
      /\blink-button\b/.test(anchor.attributes),
    );
    expect(buttons).toHaveLength(3);
    expect(buttons[0].text).toContain('Instagram');
    expect(buttons[1].text).toContain('TikTok');
    expect(buttons[2].text).toContain('Parcerias com marcas');
  });

  it.each([
    ['Instagram', 'web'],
    ['TikTok', 'web'],
    ['Parcerias com marcas', 'mailto'],
  ])('the "%s" link is a %s destination', (label, kind) => {
    const anchor = anchors(links.body).find((item) => item.text.includes(label));
    expect(anchor).toBeDefined();
    const href = attribute(anchor.attributes, 'href');
    if (kind === 'mailto') {
      expect(href.startsWith('mailto:')).toBe(true);
      expect(EMAIL.test(href.slice('mailto:'.length))).toBe(true);
      return;
    }
    const url = new URL(href);
    expect(url.protocol).toBe('https:');
    expect(attribute(anchor.attributes, 'target')).toBe('_blank');
    const rel = (attribute(anchor.attributes, 'rel') ?? '').split(/\s+/);
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  });

  it('no absolute URL is loaded by the home page', () => {
    expect(loadedAbsoluteUrls(home.body)).toEqual([]);
  });

  it('the links page loads no absolute URL except its three link destinations', () => {
    const destinations = anchors(links.body)
      .map((anchor) => attribute(anchor.attributes, 'href'))
      .filter((href) => href?.startsWith('https://'));
    const loaded = loadedAbsoluteUrls(links.body);
    expect(loaded.every((url) => destinations.includes(url))).toBe(true);
  });

  it.each([['/'], ['/links/']])(
    'no response of %s carries a Set-Cookie header (FR-035)',
    async (path) => {
      expect((await get(path)).headers.has('set-cookie')).toBe(false);
    },
  );
});
