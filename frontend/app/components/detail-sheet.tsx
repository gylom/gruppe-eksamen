import {
  Children,
  useEffect,
  type ReactNode,
  type RefObject,
} from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import { cn } from "~/lib/utils"

export type DetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  labelledById: string
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  returnFocusRef?: RefObject<Element | null>
}

export function DetailSheet({
  open,
  onOpenChange,
  labelledById,
  title,
  description,
  children,
  footer,
  returnFocusRef,
}: DetailSheetProps) {
  useEffect(() => {
    if (!open && returnFocusRef?.current instanceof HTMLElement) {
      const el = returnFocusRef.current
      window.requestAnimationFrame(() => el.focus())
    }
  }, [open, returnFocusRef])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="floating-bottom"
        showCloseButton
        aria-labelledby={labelledById}
        className={cn(
          "flex max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom,0px))] min-h-0 w-[calc(100vw-2rem)] max-w-[480px] flex-col gap-0 overflow-hidden rounded-2xl p-0",
        )}
      >
        <SheetHeader className="shrink-0 pb-4 text-left">
          <SheetTitle id={labelledById} className="pr-10">
            {title}
          </SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        {Children.count(children) > 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
        ) : null}
        {footer ? (
          <SheetFooter className="shrink-0 bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
