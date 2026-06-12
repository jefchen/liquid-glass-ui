import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * The design system's three surface containers. Compose anything
 * inside them — nested controls restyle automatically (no glass on
 * glass; chrome controls flatten to ink tints).
 *
 *  · GlassPanel  — clear Liquid Glass: floating panes over media.
 *  · FrostPanel  — the regular variant: structural chrome (bars,
 *    sidebars, text-heavy overlays). Pointer-reactive light included
 *    when used in App's chrome tracker.
 *  · ContentPanel — the calm near-solid surface content lives on.
 */

export function GlassPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("liquid-glass rounded-2xl", className)} {...props} />
}

export function FrostPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("lg-regular rounded-2xl", className)} {...props} />
}

export function ContentPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("content-surface", className)} {...props} />
}

/** Sticky frosted bar for top-level navigation chrome. */
export function ChromeBar({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "lg-regular sticky top-3 z-40 mx-auto flex items-center gap-3 rounded-2xl px-4 py-2.5",
        className
      )}
      {...props}
    />
  )
}
