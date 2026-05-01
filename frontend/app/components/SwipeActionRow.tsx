import {
  LeadingActions,
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  Type,
} from "react-swipeable-list"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export type SwipeActionRowProps = {
  children: React.ReactNode
  /** Label on the swipe surface and on the fallback control */
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  loading?: boolean
  fallbackAriaLabel: string
  actionSide?: "leading" | "trailing"
  className?: string
}

/**
 * Single-row swipe wrapper (one {@link SwipeableList} per row by design).
 * Always provides a real {@link Button} so keyboard / non-swipe users have parity.
 */
export function SwipeActionRow({
  children,
  actionLabel,
  onAction,
  disabled = false,
  loading = false,
  fallbackAriaLabel,
  actionSide = "trailing",
  className,
}: SwipeActionRowProps) {
  const { t } = useTranslation()
  const blocked = disabled || loading
  const action = (
    <SwipeAction onClick={() => !blocked && onAction()}>
      <span className="flex h-full min-w-[5rem] items-center justify-center px-3 text-sm font-medium">
        {loading ? t("common.busyEllipsis") : actionLabel}
      </span>
    </SwipeAction>
  )
  const swipeActions =
    actionSide === "leading" ? (
      <LeadingActions>{action}</LeadingActions>
    ) : (
      <TrailingActions>{action}</TrailingActions>
    )

  return (
    <SwipeableList
      className={cn("swipe-action-row-list", className)}
      type={Type.IOS}
      threshold={0.35}
    >
      <SwipeableListItem
        blockSwipe={blocked}
        listType={Type.IOS}
        leadingActions={actionSide === "leading" ? swipeActions : undefined}
        trailingActions={actionSide === "trailing" ? swipeActions : undefined}
      >
        <div className="flex w-full items-center gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 flex-1">{children}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto shrink-0 touch-manipulation"
            disabled={blocked}
            aria-busy={loading}
            aria-label={fallbackAriaLabel}
            onClick={() => {
              if (!blocked) onAction()
            }}
          >
            {loading ? t("common.busyEllipsis") : actionLabel}
          </Button>
        </div>
      </SwipeableListItem>
    </SwipeableList>
  )
}
