---
version: alpha
name: Só Saio Pra Comer
description: Design system for the Só Saio Pra Comer brand and the SSPC Studio app, derived from the 2026 media kit. Light theme tokens are normative; tokens prefixed with "dark-" define the dark theme with the same roles.
colors:
  primary: "#414B3B"
  on-primary: "#FFF9F3"
  primary-pressed: "#353D30"
  primary-container: "#DCE6D3"
  on-primary-container: "#2C3428"
  secondary: "#8CA87C"
  on-secondary: "#262D22"
  secondary-container: "#E8EFE1"
  on-secondary-container: "#2C3428"
  tertiary: "#AB8742"
  tertiary-ink: "#7A5F28"
  tertiary-container: "#F1E4C8"
  on-tertiary-container: "#5A4417"
  neutral: "#FFF9F3"
  earth: "#5D5340"
  success: "#679B6B"
  error: "#A1402B"
  on-error: "#FFF9F3"
  error-container: "#F6DCD3"
  on-error-container: "#5E2014"
  surface: "#FFF9F3"
  surface-container-lowest: "#FFFDF9"
  surface-container-low: "#FBF3EA"
  surface-container: "#F6ECE0"
  surface-container-high: "#EFE3D4"
  on-surface: "#414B3B"
  on-surface-variant: "#5D5340"
  outline: "#8A8170"
  outline-variant: "#E3D8C8"
  inverse-surface: "#2E352B"
  inverse-on-surface: "#F4EDE3"
  dark-primary: "#8CA87C"
  dark-on-primary: "#1C211A"
  dark-primary-pressed: "#7A956B"
  dark-primary-container: "#414B3B"
  dark-on-primary-container: "#E4EDDB"
  dark-secondary: "#526747"
  dark-on-secondary: "#F4EDE3"
  dark-secondary-container: "#2E3A29"
  dark-on-secondary-container: "#DCE6D3"
  dark-tertiary: "#C9A35A"
  dark-tertiary-ink: "#D8B978"
  dark-tertiary-container: "#4A3B1C"
  dark-on-tertiary-container: "#F1E4C8"
  dark-neutral: "#1C211A"
  dark-earth: "#CFC6B6"
  dark-success: "#8DBF90"
  dark-error: "#E59A86"
  dark-on-error: "#3A120A"
  dark-error-container: "#5E2014"
  dark-on-error-container: "#F6DCD3"
  dark-surface: "#1C211A"
  dark-surface-container-lowest: "#171B15"
  dark-surface-container-low: "#21271F"
  dark-surface-container: "#252B22"
  dark-surface-container-high: "#2E352B"
  dark-on-surface: "#F4EDE3"
  dark-on-surface-variant: "#CFC6B6"
  dark-outline: "#7C8573"
  dark-outline-variant: "#3A4236"
  dark-inverse-surface: "#F4EDE3"
  dark-inverse-on-surface: "#2E352B"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -0.01em
    fontVariation: "'wdth' 75, 'opsz' 96"
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 36px
    fontWeight: 800
    lineHeight: 1.0
    fontVariation: "'wdth' 75, 'opsz' 72"
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    fontVariation: "'wdth' 80, 'opsz' 48"
  title-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 22px
    fontWeight: 650
    lineHeight: 1.25
    fontVariation: "'wdth' 90, 'opsz' 24"
  title-md:
    fontFamily: Bricolage Grotesque
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    fontVariation: "'wdth' 95, 'opsz' 18"
  body-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100, 'opsz' 18"
  body-md:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100, 'opsz' 16"
  body-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100, 'opsz' 14"
  editor:
    fontFamily: Bricolage Grotesque
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.65
    fontVariation: "'wdth' 100, 'opsz' 17"
  label-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    fontVariation: "'wdth' 95, 'opsz' 16"
  label-md:
    fontFamily: Bricolage Grotesque
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
    fontVariation: "'wdth' 95, 'opsz' 14"
  label-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
    fontVariation: "'wdth' 95, 'opsz' 12"
  wordmark:
    fontFamily: Bricolage Grotesque
    fontSize: 40px
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: 0.01em
    fontVariation: "'wdth' 75, 'opsz' 96"
rounded:
  none: 0px
  sm: 8px
  md: 14px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  base: 4px
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  "10": 40px
  "12": 48px
  "16": 64px
  margin: 20px
  gutter: 16px
  tap-target: 48px
  content-max: 640px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 14px
    height: 48px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 14px
    height: 48px
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 48px
  fab:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.xl}"
    size: 60px
  status-chip-draft:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px
  status-chip-finished:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px
  status-chip-none:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px
  sync-status:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  sync-status-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px
  list-item:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 16px
  card:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: 20px
  card-sage:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.xl}"
    padding: 20px
  text-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 14px
    height: 52px
  text-field-error:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.error}"
    typography: "{typography.body-sm}"
  banner:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 16px
  editor:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.editor}"
    padding: 20px
  link-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.full}"
    padding: 18px
    height: 60px
  dark-button-primary:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
  dark-list-item:
    backgroundColor: "{colors.dark-surface-container-low}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
  dark-status-chip-draft:
    backgroundColor: "{colors.dark-tertiary-container}"
    textColor: "{colors.dark-on-tertiary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  dark-status-chip-finished:
    backgroundColor: "{colors.dark-primary-container}"
    textColor: "{colors.dark-on-primary-container}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
  dark-card-sage:
    backgroundColor: "{colors.dark-secondary}"
    textColor: "{colors.dark-on-secondary}"
    rounded: "{rounded.xl}"
---

# Só Saio Pra Comer — DESIGN.md

## Overview

Só Saio Pra Comer is a food-review profile run by a couple in Teresina, Brazil. Their promise is honesty: reviews are never sponsored, and every video ends "em mais um review sincero". The visual language comes straight from the brand's 2026 media kit: a warm cream page, deep forest-green ink, sage-green organic blobs, and old-gold line art (thin circles, arcs, plus signs and four-pointed sparkles).

The feeling is earthy, confident and hand-made, like a well-loved neighbourhood restaurant rather than a glossy food app. Typography is bold and condensed for headlines, echoing the poster-style titles of the media kit, and calm and open for reading.

The same system serves two contexts:

- **Brand pages** (sosaiopracomer.com, the links page): expressive. Large condensed headlines, organic blobs, gold line art.
- **SSPC Studio** (studio.sosaiopracomer.com, a private mobile PWA for writing visit notes and scripts): quiet and utilitarian. The brand shows up in color, type and corner shapes; decoration is reserved for empty states and the login screen.

All interface copy is in Brazilian Portuguese, in sentence case. Design mobile-first at 375px wide.

## Colors

The palette is taken from the media kit; derived tints keep text accessible.

- **Forest Ink (#414B3B) — primary:** the brand's deep olive-forest green. Headlines, body text, primary buttons and the wordmark. Cream text on it reaches 8.8:1.
- **Sage Leaf (#8CA87C) — secondary:** the media kit's blob and card green. Use for large surfaces, blobs and highlight cards, always with Deep Moss text (#262D22), never with Forest Ink (3.5:1 is too low for body text).
- **Old Gold (#AB8742) — tertiary:** line art, sparkles, hairline dividers, focus rings and icons. It is decorative: never use it for text on cream (3.2:1). When gold text is needed, use Gold Ink (#7A5F28).
- **Cream Linen (#FFF9F3) — neutral and surface:** the page background everywhere. Never pure white.
- **Earth Brown (#5D5340):** secondary text, captions and metadata (7.2:1 on cream).
- **Garden Green (#679B6B) — success:** the "finished" indicator dot and success icons only, never as a text or button color.
- **Brick (#A1402B) — error:** errors and destructive actions only.
- **Surface containers:** cream steps from #FFFDF9 (inputs) to #EFE3D4 (pressed and high-emphasis areas). Depth comes from these tonal steps.
- **Status pairs:** draft notes use Gold Cream (#F1E4C8) with #5A4417 text; finished notes use Pale Sage (#DCE6D3) with #2C3428 text.

**Dark theme** (tokens prefixed `dark-`): the page becomes Night Forest (#1C211A) with cream text (#F4EDE3); Sage Leaf becomes the primary action color with Night Forest text; gold lightens to #C9A35A. Roles map one-to-one to the light theme.

## Typography

One variable family, **Bricolage Grotesque** (open source, SIL OFL), self-hosted. It replaces the media kit's Anton + Montserrat pair: its width axis gives the same condensed poster energy as Anton for headlines, while the normal width and optical sizes make it comfortable for long notes on a phone.

- **Display, headlines and wordmark:** weight 700 to 800, width 75 to 80 (condensed). Tight line height. The wordmark "SÓ SAIO PRA COMER" is the only text set in all caps.
- **Titles and labels:** weight 600 to 650, width 90 to 95.
- **Body and editor:** weight 400, width 100, optical size matching the font size. The editor uses 17px with 1.65 line height for comfortable writing on a phone.
- **Rules:** sentence case for every heading, button and label; no all-caps labels; no letter-spaced eyebrow text; at most two weights per screen.

## Layout

- **Mobile-first single column:** 20px side margins, 16px gutters, content capped at 640px on larger screens and centered.
- **4px spacing grid:** steps of 4, 8, 12, 16, 20, 24, 32, 40, 48 and 64.
- **Touch:** every tap target is at least 48px.
- **App chrome:** a compact top bar with the screen title and the sync status pill; a floating action button bottom-right for the main action; content respects iOS safe areas.
- **Alignment:** brand pages center their hero; app screens are left aligned.

## Elevation & Depth

Depth comes from **tonal layers**, not shadows: cards sit one cream step darker than the page, and pressed states go one step darker again. Gold hairlines (1.5px) separate sections on brand pages. Only floating elements (the floating action button, dialogs and the update banner) carry a shadow: a soft, low forest-tinted shadow, never grey.

Organic blobs (Sage Leaf or Forest Ink) sit behind content on brand pages, bleeding off the edges of the viewport as in the media kit. They never sit behind body text.

## Shapes

- **Corners:** soft and generous. Buttons, chips and status pills are fully rounded pills; list items use 20px; cards 28px; inputs 14px.
- **Arch frame:** photos of the creators or of dishes use an arch (fully rounded top, square bottom), echoing the media kit's partnership page.
- **Organic blobs:** asymmetric, fluid shapes with no straight edges, used large and partially off-canvas.
- **Line art:** thin Old Gold circles, open arcs, small plus signs, dots and four-pointed sparkles, scattered sparsely around heroes. Never more than five ornaments in one viewport.
- **Icons:** Lucide line icons at 1.75px stroke, in Forest Ink or Old Gold.

## Components

- **Buttons:** pill-shaped and 48px tall. Primary is Forest Ink with cream text; secondary is Pale Sage with dark green text; ghost is text-only Forest Ink. Pressed states darken one step. Labels are verbs in sentence case ("Salvar", "Criar visita", "Terminei").
- **Floating action button:** 60px, Forest Ink, 28px corner radius (a soft squircle, not a circle), with a plus icon; it creates a new visit.
- **Status chip:** a small pill showing a note's state: "Rascunho" (Gold Cream), "Pronta" (Pale Sage with a Garden Green dot), "Sem nota" (cream container, Earth Brown text).
- **Sync status:** a pill in the top bar with an icon and a short label: "Sincronizado", "2 pendentes", "Sem conexão" or "Erro ao sincronizar" (Brick container). It is always visible in the app.
- **List item (visit):** a 20px-rounded cream card with the place name as title, the date in Earth Brown below, and two status chips (one per person) on the right.
- **Text field:** an input in the lightest cream with a 1px Outline border and a 14px radius; the label sits above it; focus shows a 2px Old Gold ring; errors show Brick helper text below.
- **Banner:** a Pale Sage strip with a short message and one action, used for "Nova versão disponível".
- **Rich text editor:** a borderless writing area on Cream Linen with the editor type style and a slim toolbar (bold, italic, bullet list, checklist) docked above the keyboard.
- **Empty state:** a sage blob with a gold sparkle, one short sentence and one primary action.
- **Link button (brand links page):** full-width 60px pills, Forest Ink with cream text and a leading Lucide icon. Brand logos of social networks are never drawn; use generic icons and clear labels.

## Do's and Don'ts

- Do keep Cream Linen as the background of every screen; never use pure white or grey backgrounds.
- Do use Forest Ink for text on cream, and Deep Moss (#262D22) for text on Sage Leaf.
- Don't use Old Gold, Sage Leaf or Garden Green for text on cream; they are for shapes, lines and icons.
- Do write every label in sentence case and in Brazilian Portuguese.
- Don't add blobs or line art behind lists, forms or the editor in the app; keep the tool calm.
- Do keep one primary action per screen.
- Don't draw the logos of Instagram, TikTok or any other brand.
- Do keep tap targets at 48px or more and respect iOS safe areas.
- Don't mix sharp corners with the rounded shape language.
- Do respect reduced-motion preferences: the only decorative motion is a slow drawing of the gold line art on brand pages.
