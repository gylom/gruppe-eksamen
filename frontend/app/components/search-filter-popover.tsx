import { useEffect, useRef, type ReactNode } from "react"
import { Search } from "lucide-react"

import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"

export type FilterChip = { id: number; navn: string }

export interface SearchFilterPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasActiveFilters: boolean

  searchId: string
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchAriaLabel: string

  categories: FilterChip[]
  selectedCategoryId: number | null
  onSelectCategoryId: (id: number | null) => void
  categoryGroupAriaLabel: string
  allLabel: string
  chipAriaTemplate: (args: {
    type: string
    name: string
    selectedSuffix: string
  }) => string
  chipAriaType: string
  selectedChipSuffix: string
  categoriesLoading?: boolean
  categoriesLoadingLabel?: string

  triggerAriaLabel: string
  /** Optional extra content rendered below the filter chips (e.g. sort controls). */
  extra?: ReactNode
}

export function SearchFilterPopover({
  open,
  onOpenChange,
  hasActiveFilters,
  searchId,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  categories,
  selectedCategoryId,
  onSelectCategoryId,
  categoryGroupAriaLabel,
  allLabel,
  chipAriaTemplate,
  chipAriaType,
  selectedChipSuffix,
  categoriesLoading,
  categoriesLoadingLabel,
  triggerAriaLabel,
  extra,
}: SearchFilterPopoverProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) searchInputRef.current?.focus({ preventScroll: true })
  }, [open])

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className={cn(
          buttonVariants({
            variant: hasActiveFilters ? "default" : "outline",
            size: "icon",
          }),
          "shrink-0"
        )}
        aria-label={triggerAriaLabel}
      >
        <Search className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-80 space-y-3 p-4"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={searchInputRef}
            id={searchId}
            type="search"
            autoComplete="off"
            aria-label={searchAriaLabel}
            placeholder={searchPlaceholder}
            className="pl-10"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="border-t border-border pt-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={categoryGroupAriaLabel}
          >
            <Button
              type="button"
              size="sm"
              variant={selectedCategoryId == null ? "default" : "outline"}
              aria-pressed={selectedCategoryId == null}
              onClick={() => onSelectCategoryId(null)}
            >
              {allLabel}
            </Button>
            {categoriesLoading ? (
              <span className="text-xs text-muted-foreground">
                {categoriesLoadingLabel}
              </span>
            ) : null}
            {categories.map((c) => {
              const selected = selectedCategoryId === c.id
              const chipSuffix = selected ? selectedChipSuffix : ""
              return (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  aria-label={chipAriaTemplate({
                    type: chipAriaType,
                    name: c.navn,
                    selectedSuffix: chipSuffix,
                  })}
                  onClick={() => onSelectCategoryId(selected ? null : c.id)}
                >
                  {c.navn}
                </Button>
              )
            })}
          </div>
        </div>

        {extra ? (
          <div className="border-t border-border pt-3">{extra}</div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
