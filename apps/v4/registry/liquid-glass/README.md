# Liquid Glass for shadcn/ui

A material layer that applies Apple's **Liquid Glass** design language (WWDC 2025/2026) on top of every shadcn/ui component, plus a programmatic theme generator.

## How it works

shadcn/ui v4 components expose `data-slot` attributes on every primitive. `liquid-glass.css` targets those slots, so the entire component library picks up the glass material **without modifying any component source**:

- **Translucency & vibrancy** — `backdrop-filter: blur() saturate()` with a theme-driven tint (`--lg-tint`).
- **Specular highlights** — inset top-edge highlight plus a radial specular sweep, echoing light on curved glass.
- **Lensing / refraction** — opt-in `.lg-lens` class backed by an SVG `feDisplacementMap` filter (`<LiquidLens />`), for floating chrome like docks and toolbars.
- **Adaptive transparency** — a single `--lg-opacity` token mirrors Apple's 2026 transparency slider, from clear glass to fully opaque. Honors `prefers-reduced-transparency`.
- **Legibility first** — text sits on solid foreground layers; glass is reserved for surfaces and chrome, per Apple's HIG.

## Usage

```tsx
// app/layout.tsx
import "@/registry/liquid-glass/liquid-glass.css"
import { LiquidLens } from "@/registry/liquid-glass/liquid-lens"
```

All cards, dialogs, popovers, menus, buttons, inputs, tabs, tooltips, sidebars, etc. become Liquid Glass surfaces automatically.

## Theme generator

`theme-generator.ts` builds a complete light/dark shadcn variable set plus glass tint from any palette (for example, colors extracted from an image):

```ts
import { extractPalette, buildTheme, themeToCss } from "./theme-generator"

const palette = extractPalette(imageData.data) // dominant colors
const theme = buildTheme(palette, "sunset")
const css = themeToCss(theme) // drop into globals.css
```

A hosted generator with AI image-to-theme, live component preview (mobile/desktop), and source download is built on this module: see **Glass Studio**.
