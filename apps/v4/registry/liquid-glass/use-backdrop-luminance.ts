import * as React from "react"

/**
 * Approximates Apple's real-time material adaptation: samples the
 * average luminance of the backdrop actually behind an element —
 * the wallpaper image (drawn cover-fit into a tiny offscreen canvas)
 * blended with the content panel as it scrolls underneath — and
 * reports it so chrome can flip light/dark like native Liquid Glass.
 */
export function useBackdropLuminance(
  ref: React.RefObject<HTMLElement | null>,
  imageSrc: string,
  panelLuminance: number
): number {
  const [lum, setLum] = React.useState(0.8)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    const img = new Image()
    img.crossOrigin = "anonymous"
    let ready = false
    let raf = 0

    const draw = () => {
      const vw = window.innerWidth || 1
      const vh = window.innerHeight || 1
      canvas.width = 96
      canvas.height = Math.max(8, Math.round((96 * vh) / vw))
      if (!ctx || !img.width) return
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
      ready = true
      measure()
    }

    const measure = () => {
      if (!ready || !ctx) return
      const r = el.getBoundingClientRect()
      const vw = window.innerWidth || 1
      const vh = window.innerHeight || 1
      const x = Math.floor(Math.max(0, (r.left / vw) * canvas.width))
      const y = Math.floor(Math.max(0, (r.top / vh) * canvas.height))
      const w = Math.max(1, Math.floor((r.width / vw) * canvas.width))
      const h = Math.max(1, Math.ceil((r.height / vh) * canvas.height))
      let wall = 0.8
      try {
        const d = ctx.getImageData(x, y, Math.min(w, canvas.width - x), Math.min(h, canvas.height - y)).data
        let sum = 0
        for (let i = 0; i < d.length; i += 4) {
          sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
        }
        wall = sum / (d.length / 4) / 255
      } catch {
        /* tainted canvas — keep fallback */
      }

      // Blend with the content panel where it slides under the element.
      // The panel is ~62% opaque, so it never fully masks the wallpaper.
      const panel = document.querySelector(".content-surface")
      let f = 0
      if (panel) {
        const pr = panel.getBoundingClientRect()
        const overlap =
          Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top)
        f = Math.max(0, Math.min(1, overlap / r.height))
      }
      const panelEff = 0.62 * panelLuminance + 0.38 * wall
      setLum(wall * (1 - f) + panelEff * f)
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    img.onload = draw
    img.src = imageSrc
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", draw)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", draw)
      cancelAnimationFrame(raf)
    }
  }, [ref, imageSrc, panelLuminance])

  return lum
}
