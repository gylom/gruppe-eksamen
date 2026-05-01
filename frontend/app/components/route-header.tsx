import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

interface RouteHeaderProps {
  title?: string
  titleId?: string
  subtitle?: string
  /** Sticky-fixed overlay action (top-right); reserves a matching spacer in the title row */
  action?: ReactNode
  /**
   * Replaces default `size-9` spacer when `action` is set — use for wider top-right controls
   * (e.g. label buttons).
   */
  actionSpacerClassName?: string
  /** When set, title row becomes a three-column grid: left | center | aside */
  center?: ReactNode
  /** Left column in that grid (e.g. week navigator); stacks above title/subtitle when those exist */
  leading?: ReactNode
  /** Right column in the three-column grid when `center` or `leading` is set */
  aside?: ReactNode
  /** Additional content rows rendered below the title row */
  below?: ReactNode
  /**
   * Makes the header sticky (top-0, backdrop-blur, border-b).
   * Use for routes where the header must stay visible while the list scrolls.
   */
  sticky?: boolean
}

export function RouteHeader({
  title,
  titleId,
  subtitle,
  action,
  actionSpacerClassName,
  aside,
  center,
  leading,
  below,
  sticky = false,
}: RouteHeaderProps) {
  const showHeading = title != null && title.length > 0
  const showTitleStack = showHeading || Boolean(subtitle)
  const useThreeColumnGrid = center != null || leading != null

  const trailing =
    aside ??
    (action ? (
      <div
        className={cn("shrink-0", actionSpacerClassName ?? "size-9")}
        aria-hidden
      />
    ) : null)

  const titleBlock = (
    <div className="min-w-0">
      {showHeading ? (
        <h1
          id={titleId}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h1>
      ) : null}
      {subtitle ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )

  const leftGridColumn =
    leading != null ? (
      <div className="min-w-0 justify-self-start">
        {leading}
        {showTitleStack ? (
          <div className={cn(leading ? "mt-2" : undefined)}>{titleBlock}</div>
        ) : null}
      </div>
    ) : (
      <div className="min-w-0 justify-self-start">{titleBlock}</div>
    )

  const titleRow =
    useThreeColumnGrid ? (
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 sm:gap-x-3">
        {leftGridColumn}
        <div className="flex shrink-0 justify-self-center">
          {center ?? null}
        </div>
        <div className="flex min-w-0 shrink-0 justify-end justify-self-end">
          {trailing}
        </div>
      </div>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-3">
        {titleBlock}
        {trailing}
      </div>
    )

  if (sticky) {
    return (
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl">
          {titleRow}
          {below}
        </div>
      </header>
    )
  }

  return (
    <>
      {action ? (
        <div className="pointer-events-none fixed top-0 left-1/2 z-10 flex w-full max-w-2xl -translate-x-1/2 items-center justify-end px-4 pt-6">
          <div className="pointer-events-auto">{action}</div>
        </div>
      ) : null}
      <div className="mx-auto max-w-2xl pt-6">
        {titleRow}
        {below}
      </div>
    </>
  )
}
