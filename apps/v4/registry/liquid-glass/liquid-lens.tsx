"use client"

/**
 * Mounts the SVG displacement filter used for Liquid Glass edge lensing.
 * Render once near the app root, then add the `lg-lens` class to any
 * floating glass surface (toolbar, dock, nav bar) to enable refraction.
 * Keep usage to a few elements — backdrop displacement is GPU-expensive.
 */
export function LiquidLens({ strength = 40 }: { strength?: number }) {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <filter id="lg-lens" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.012"
          numOctaves="2"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="soft"
          scale={strength}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}
