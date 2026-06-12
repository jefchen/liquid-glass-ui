"use client"

import * as React from "react"
import { makeDisplacementMap } from "./liquid-lens"

/**
 * "For controls like sliders and toggles, the knob transforms into
 * Liquid Glass during interaction" — WWDC25. This mounts one shared
 * fixed-size lens filter matching the slider knob capsule (27×18);
 * CSS applies it to [data-slot="slider-thumb"]:active so the knob
 * refracts the track and fill beneath it while dragged.
 */
export function KnobLens() {
  const [map, setMap] = React.useState<string | null>(null)
  React.useEffect(() => {
    setMap(makeDisplacementMap(27, 18, 9, 7))
  }, [])
  if (!map) return null
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <filter
        id="knob-lens"
        x="0"
        y="0"
        width="27"
        height="18"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage href={map} x="0" y="0" width="27" height="18" result="map" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale={10}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}
