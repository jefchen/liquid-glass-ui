"use client"

import * as React from "react"

/**
 * True Liquid Glass edge refraction, per the displacement-map technique
 * (CSS backdrop-filter referencing an SVG feImage displacement map):
 * red channel encodes X offset, green encodes Y, 0x80 is neutral. The
 * map is generated per element from a signed-distance field of its
 * rounded-rect shape, so only a smooth ring at the rim refracts —
 * matching how light bends through the curved edge of real glass.
 *
 * Chromium-only (backdrop-filter: url() support); other engines fall
 * back to the base blur declared by the material layer.
 */

export function makeDisplacementMap(w: number, h: number, radius: number, rim: number): string {
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  const img = ctx.createImageData(w, h)
  const data = img.data
  const r = Math.min(radius, w / 2, h / 2)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Signed distance to the rounded-rect edge (negative = inside)
      const qx = Math.abs(x - w / 2) - (w / 2 - r)
      const qy = Math.abs(y - h / 2) - (h / 2 - r)
      const dx = Math.max(qx, 0)
      const dy = Math.max(qy, 0)
      const dist = Math.hypot(dx, dy) + Math.min(Math.max(qx, qy), 0) - r

      // Refraction strength follows a circular lens profile (the sag of
      // a spherical cap): nearly flat in the center, bending sharply at
      // the rim — physical curvature, not a linear ramp.
      const t = Math.min(Math.max((dist + rim) / rim, 0), 1)
      const strength = 1 - Math.sqrt(Math.max(0, 1 - t * t))

      // Displace outward along the SDF gradient (approximated radially
      // from the nearest edge), bending samples toward the outside like
      // a convex lens rim.
      let nx = 0
      let ny = 0
      if (dx > 0 || dy > 0) {
        const len = Math.hypot(dx, dy) || 1
        nx = (dx / len) * Math.sign(x - w / 2)
        ny = (dy / len) * Math.sign(y - h / 2)
      } else {
        nx = qx > qy ? Math.sign(x - w / 2) : 0
        ny = qy >= qx ? Math.sign(y - h / 2) : 0
      }

      const i = (y * w + x) * 4
      data[i] = 128 + nx * strength * 127 // R: x offset
      data[i + 1] = 128 + ny * strength * 127 // G: y offset
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

let lensCounter = 0

/**
 * Wraps floating chrome (toolbars, docks, headers) in a refracting
 * glass surface. Generates a displacement map sized to the element and
 * applies it via backdrop-filter, on top of the material layer's blur.
 */
export function GlassLens({
  children,
  className,
  strength = 28,
  rim = 18,
  disabled = false,
  style,
  ...props
}: React.ComponentProps<"div"> & { strength?: number; rim?: number; disabled?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [filterId] = React.useState(() => `lg-lens-${++lensCounter}`)
  const [map, setMap] = React.useState<{ href: string; w: number; h: number } | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const { width, height } = el.getBoundingClientRect()
        const w = Math.round(width)
        const h = Math.round(height)
        if (!w || !h) return
        const radius = parseFloat(getComputedStyle(el).borderRadius) || 16
        setMap({ href: makeDisplacementMap(w, h, radius, rim), w, h })
      })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [rim])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(map && !disabled
          ? ({
              WebkitBackdropFilter: `blur(var(--lg-blur)) saturate(var(--lg-saturation)) url(#${filterId})`,
              backdropFilter: `blur(var(--lg-blur)) saturate(var(--lg-saturation)) url(#${filterId})`,
            } as React.CSSProperties)
          : undefined),
      }}
      {...props}
    >
      {map && (
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
          <filter
            id={filterId}
            x="0"
            y="0"
            width={map.w}
            height={map.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map.href}
              x="0"
              y="0"
              width={map.w}
              height={map.h}
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
      {children}
    </div>
  )
}

/** Legacy global turbulence filter — kept for the `.lg-lens` class. */
export function LiquidLens({ strength = 40 }: { strength?: number }) {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <filter id="lg-lens" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale={strength} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
