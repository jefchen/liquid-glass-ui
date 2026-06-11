/**
 * Liquid Glass theme generator.
 *
 * Takes a palette (e.g. extracted from an image) and produces a full set
 * of shadcn CSS variables plus Liquid Glass material tokens, for both
 * light and dark modes. Colors are emitted as HSL triplets compatible
 * with `hsl(var(--token))` usage and with the `--lg-tint` material token.
 */

export type RGB = { r: number; g: number; b: number }

export type GlassTheme = {
  name: string
  light: Record<string, string>
  dark: Record<string, string>
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

const hsl = (h: number, s: number, l: number) =>
  `${((h % 360) + 360) % 360} ${clamp(s)}% ${clamp(l)}%`
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(n)))

/**
 * Extract dominant colors from raw RGBA pixel data using coarse
 * 4-bit-per-channel histogram binning (fast, dependency-free).
 */
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
  return [...bins.values()]
    .sort((x, y) => y.c - x.c)
    .filter((bin) => {
      const [, s, l] = rgbToHsl({ r: bin.r / bin.c, g: bin.g / bin.c, b: bin.b / bin.c })
      return l > 8 && l < 95 && s > 5 // drop near-black/white/gray bins
    })
    .slice(0, count)
    .map((bin) => ({
      r: Math.round(bin.r / bin.c),
      g: Math.round(bin.g / bin.c),
      b: Math.round(bin.b / bin.c),
    }))
}

export function buildTheme(palette: RGB[], name = "custom"): GlassTheme {
  const [p, a = p, t = p] = palette.map(rgbToHsl)
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
    "--destructive": "0 72% 51%",
    "--border": hsl(ph, 20, 88),
    "--input": hsl(ph, 20, 88),
    "--ring": hsl(ph, ps, 50),
    "--lg-tint": hsl(th, Math.min(ts, 50), 96),
  }

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
    "--destructive": "0 62% 45%",
    "--border": hsl(ph, 15, 20),
    "--input": hsl(ph, 15, 20),
    "--ring": hsl(ph, ps, 60),
    "--lg-tint": hsl(th, Math.min(ts, 40), 13),
  }

  return { name, light, dark }
}

export function themeToCss(theme: GlassTheme): string {
  const block = (vars: Record<string, string>) =>
    Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")
  return `/* Liquid Glass theme: ${theme.name} */\n:root {\n${block(theme.light)}\n}\n\n.dark {\n${block(theme.dark)}\n}\n`
}
