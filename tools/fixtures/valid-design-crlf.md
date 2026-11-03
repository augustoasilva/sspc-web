---
version: alpha
name: Fixture
description: Minimal valid design for the tools tests.
colors:
  primary: '#414B3B'
  on-primary: '#FFF9F3'
  surface: '#FFF9F3'
  on-surface: '#414B3B'
  dark-primary: '#8CA87C'
  dark-on-primary: '#1C211A'
  dark-surface: '#1C211A'
  dark-on-surface: '#F4EDE3'
typography:
  body-md:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100, 'opsz' 16"
rounded:
  md: 14px
  DEFAULT: 0.5rem
spacing:
  base: 4px
  '4': 16px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
    height: 48px
  fab:
    backgroundColor: '{colors.primary}'
    size: 60px
---

# Fixture
