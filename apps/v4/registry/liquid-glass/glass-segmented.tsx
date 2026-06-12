"use client"

import * as React from "react"
import { makeDisplacementMap } from "./liquid-lens"

let segCounter = 0

export type SegmentedOption = { value: string; label: string }

/**
 * Apple-style segmented control: a flat gray frosted track with a
 * clear Liquid Glass thumb that slides to the selection on a spring.
 * The thumb carries an SDF displacement filter, so label text warps
 * at the glass edge as the thumb passes over it — like the native
 * control's refraction.
 */
export function GlassSegmented({
  options,
  value,
  onValueChange,
  className,
  size = "default",
}: {
  options: SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  size?: "sm" | "default"
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [filterId] = React.useState(() => `seg-lens-${++segCounter}`)
  const [rect, setRect] = React.useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [map, setMap] = React.useState<{ href: string; w: number; h: number } | null>(null)
  // Refraction only while the glass is moving — settled labels stay crisp
  const [sliding, setSliding] = React.useState(false)
  const firstRender = React.useRef(true)
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSliding(true)
    const t = setTimeout(() => setSliding(false), 550)
    return () => clearTimeout(t)
  }, [value])

  const measure = React.useCallback(() => {
    const c = containerRef.current
    if (!c) return
    const el = c.querySelector<HTMLElement>(`button[data-value="${CSS.escape(value)}"]`)
    if (!el) return
    const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = el
    setRect({ left, top, width, height })
    setMap((prev) =>
      prev && prev.w === width && prev.h === height
        ? prev
        : { href: makeDisplacementMap(width, height, height / 2, 9), w: width, h: height }
    )
  }, [value])

  React.useEffect(() => {
    measure()
    const c = containerRef.current
    if (!c) return
    const ro = new ResizeObserver(measure)
    ro.observe(c)
    return () => ro.disconnect()
  }, [measure])

  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      className={`relative inline-flex items-center rounded-full p-1 ${className ?? ""}`}
      style={{ background: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
    >
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 rounded-full"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            transition:
              "left 0.5s linear(0, 0.32 8%, 0.74 16%, 1.08 26%, 1.18 32%, 1.1 40%, 0.99 50%, 0.95 58%, 1.01 70%, 1.005 80%, 1), width 0.3s ease",
            background: "color-mix(in srgb, white 26%, transparent)",
            WebkitBackdropFilter: sliding
              ? `blur(1.5px) saturate(1.6) url(#${filterId})`
              : "saturate(1.4)",
            backdropFilter: sliding
              ? `blur(1.5px) saturate(1.6) url(#${filterId})`
              : "saturate(1.4)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.55), inset 1.5px 2.5px 1.5px -2px rgba(255,255,255,0.95), inset -1px -1.5px 1.5px -2px rgba(255,255,255,0.5), 0 3px 8px rgba(0,20,50,0.25)",
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          data-value={o.value}
          onClick={() => onValueChange(o.value)}
          className={`relative rounded-full font-medium whitespace-nowrap transition-colors duration-200 ${pad} ${
            value === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
      {map && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter
            id={filterId}
            x="0"
            y="0"
            width={map.w}
            height={map.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={map.href} x="0" y="0" width={map.w} height={map.h} result="map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={14}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}
    </div>
  )
}
