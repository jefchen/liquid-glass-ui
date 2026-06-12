import { fontStack } from "./fonts"

export type RGB = { r: number; g: number; b: number }

export type GlassTheme = {
  name: string
  palette: RGB[]
  light: Record<string, string>
  dark: Record<string, string>
  glass: { opacity: number; blur: number; saturation: number }
  fonts: { sans: string; mono: string }
}

export function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(n)))
const hsl = (h: number, s: number, l: number) =>
  `hsl(${((h % 360) + 360) % 360} ${clamp(s)}% ${clamp(l)}%)`

export function extractPalette(data: Uint8ClampedArray, count = 5): RGB[] {
  const bins = new Map<number, { c: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3]
    if (a < 128) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bin = bins.get(key) ?? { c: 0, r: 0, g: 0, b: 0 }
    bin.c++; bin.r += r; bin.g += g; bin.b += b
    bins.set(key, bin)
  }
  const ranked = [...bins.values()]
    .map((bin) => ({ r: bin.r / bin.c, g: bin.g / bin.c, b: bin.b / bin.c, c: bin.c }))
    .sort((x, y) => y.c - x.c)
  const colorful = ranked.filter((p) => {
    const [, s, l] = rgbToHsl(p)
    return l > 8 && l < 95 && s > 5
  })
  return (colorful.length >= count ? colorful : ranked)
    .slice(0, count)
    .map((p) => ({ r: Math.round(p.r), g: Math.round(p.g), b: Math.round(p.b) }))
}

export function buildTheme(palette: RGB[], name = "custom"): GlassTheme {
  // Apple system blue (#007AFF) anchors the default theme
  const fallback: RGB = { r: 0, g: 122, b: 255 }
  const pal = palette.length ? palette : [fallback]
  const [p, a = p, t = p] = pal.map(rgbToHsl)
  const [ph, ps, pl] = p
  const [ah, as_] = a
  const [th, ts] = t

  const light: Record<string, string> = {
    "--background": hsl(ph, Math.min(ps, 30), 97),
    "--foreground": hsl(ph, 25, 10),
    "--card": hsl(ph, Math.min(ps, 25), 99),
    "--card-foreground": hsl(ph, 25, 10),
    "--popover": hsl(ph, Math.min(ps, 25), 99),
    "--popover-foreground": hsl(ph, 25, 10),
    "--primary": hsl(ph, ps, Math.min(Math.max(pl, 35), 55)),
    "--primary-foreground": hsl(ph, 20, 98),
    "--secondary": hsl(ah, Math.min(as_, 40), 92),
    "--secondary-foreground": hsl(ah, 30, 15),
    "--muted": hsl(ph, 15, 93),
    "--muted-foreground": hsl(ph, 10, 42),
    "--accent": hsl(ah, as_, 88),
    "--accent-foreground": hsl(ah, 40, 15),
    "--destructive": "hsl(4 100% 59%)", // Apple system red #FF3B30
    "--border": hsl(ph, 20, 88),
    "--input": hsl(ph, 20, 88),
    "--ring": hsl(ph, ps, 50),
    "--lg-tint": hsl(th, Math.min(ts, 50), 96),
  }
  light["--sidebar"] = light["--card"]
  light["--sidebar-foreground"] = light["--foreground"]
  light["--sidebar-primary"] = light["--primary"]
  light["--sidebar-primary-foreground"] = light["--primary-foreground"]
  light["--sidebar-accent"] = light["--accent"]
  light["--sidebar-accent-foreground"] = light["--accent-foreground"]
  light["--sidebar-border"] = light["--border"]
  light["--sidebar-ring"] = light["--ring"]

  const dark: Record<string, string> = {
    "--background": hsl(ph, Math.min(ps, 30), 7),
    "--foreground": hsl(ph, 15, 95),
    "--card": hsl(ph, Math.min(ps, 25), 10),
    "--card-foreground": hsl(ph, 15, 95),
    "--popover": hsl(ph, Math.min(ps, 25), 10),
    "--popover-foreground": hsl(ph, 15, 95),
    "--primary": hsl(ph, ps, Math.max(pl, 60)),
    "--primary-foreground": hsl(ph, 30, 8),
    "--secondary": hsl(ah, Math.min(as_, 30), 16),
    "--secondary-foreground": hsl(ah, 15, 92),
    "--muted": hsl(ph, 12, 15),
    "--muted-foreground": hsl(ph, 10, 62),
    "--accent": hsl(ah, Math.min(as_, 50), 22),
    "--accent-foreground": hsl(ah, 15, 92),
    "--destructive": "hsl(3 100% 61%)", // Apple system red (dark) #FF453A
    "--border": hsl(ph, 15, 20),
    "--input": hsl(ph, 15, 20),
    "--ring": hsl(ph, ps, 60),
    "--lg-tint": hsl(th, Math.min(ts, 40), 13),
  }
  dark["--sidebar"] = dark["--card"]
  dark["--sidebar-foreground"] = dark["--foreground"]
  dark["--sidebar-primary"] = dark["--primary"]
  dark["--sidebar-primary-foreground"] = dark["--primary-foreground"]
  dark["--sidebar-accent"] = dark["--accent"]
  dark["--sidebar-accent-foreground"] = dark["--accent-foreground"]
  dark["--sidebar-border"] = dark["--border"]
  dark["--sidebar-ring"] = dark["--ring"]

  return {
    name,
    palette: pal,
    light,
    dark,
    glass: { opacity: 0.6, blur: 18, saturation: 1.6 },
    fonts: { sans: "inter", mono: "geist-mono" },
  }
}

export function themeToCss(theme: GlassTheme): string {
  const block = (vars: Record<string, string>) =>
    Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")
  const glassVars = [
    `  --lg-opacity: ${theme.glass.opacity};`,
    `  --lg-blur: ${theme.glass.blur}px;`,
    `  --lg-saturation: ${theme.glass.saturation};`,
    `  --font-sans: ${fontStack(theme.fonts.sans)};`,
    `  --font-mono: ${fontStack(theme.fonts.mono)};`,
  ].join("\n")
  return `/* Liquid Glass theme: ${theme.name} — generated by Glass Studio */\n:root {\n${block(theme.light)}\n${glassVars}\n}\n\n.dark {\n${block(theme.dark)}\n}\n`
}

/** Flatten a theme into the vars applied to a document for live preview. */
export function themeVars(theme: GlassTheme, mode: "light" | "dark"): Record<string, string> {
  return {
    ...(mode === "dark" ? theme.dark : theme.light),
    // Glass has no dark variant — the material tint always comes from
    // the light palette; it sits on whatever image is behind it.
    "--lg-tint": theme.light["--lg-tint"],
    "--lg-opacity": String(theme.glass.opacity),
    "--lg-blur": `${theme.glass.blur}px`,
    "--lg-saturation": String(theme.glass.saturation),
    "--font-sans": fontStack(theme.fonts.sans),
    "--font-mono": fontStack(theme.fonts.mono),
  }
}
