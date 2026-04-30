import { useMemo, useRef, useState } from "react"
import { Link } from "react-router"
import { CalendarClock, Search, ShoppingBasket, Star } from "lucide-react"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import type { CookbookHistoryItem, CookbookSortMode } from "~/features/cookbook/types"
import { useCookbookHistory, type CookbookHistoryFilters } from "~/features/cookbook/use-cookbook-history"
import { useHousehold } from "~/features/household/use-household"
import { AddToPlanPanel } from "~/features/planning/add-to-plan-panel"
import {
  PLANNING_MEAL_FALLBACK_NAVN,
  PLANNING_MEAL_TYPE_IDS,
  PLANNING_MEAL_TYPE_ORDER,
  sortPlanningCategories,
} from "~/features/planning/constants"
import { useCreatePlannedMeal } from "~/features/planning/use-planned-meals"
import { useDebouncedValue, useRecipeCategories } from "~/features/recipes/use-recipes"

const BOOK_SEARCH_ID = "book-cookbook-search"
const BOOK_PLAN_FORM_ID = "book-add-plan-form"

function formatLastCookedNb(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium" }).format(d)
}

export default function BookRoute() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const trimmed = debouncedSearch.trim()
  const [mealTypeId, setMealTypeId] = useState<number | null>(null)
  const [sort, setSort] = useState<CookbookSortMode>("ratingThenRecent")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CookbookHistoryItem | null>(null)

  const filters: CookbookHistoryFilters = useMemo(
    () => ({
      search: trimmed.length > 0 ? trimmed : null,
      mealTypeId,
      sort,
    }),
    [trimmed, mealTypeId, sort],
  )

  const cookbookQuery = useCookbookHistory(filters)
  const householdQuery = useHousehold()
  const categoriesQuery = useRecipeCategories()
  const createPlannedMealMutation = useCreatePlannedMeal()

  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const planningMealCategories = useMemo(() => {
    const raw = categoriesQuery.data ?? []
    const filtered = sortPlanningCategories(raw.filter((c) => PLANNING_MEAL_TYPE_IDS.has(c.id)))
    if (filtered.length > 0) return filtered
    return PLANNING_MEAL_TYPE_ORDER.map((id) => ({
      id,
      navn: PLANNING_MEAL_FALLBACK_NAVN[id] ?? `Måltid ${id}`,
    }))
  }, [categoriesQuery.data])

  const hasActiveFilters = trimmed.length > 0 || mealTypeId != null
  const items = cookbookQuery.data?.items ?? null
  const listEmpty = items != null && items.length === 0 && !cookbookQuery.isFetching
  const emptyCookbook = listEmpty && !hasActiveFilters && !cookbookQuery.isError
  const noResults = listEmpty && hasActiveFilters && !cookbookQuery.isError

  const householdMemberCount = householdQuery.data?.medlemmer.length ?? null

  function clearFilters() {
    setSearch("")
    setMealTypeId(null)
  }

  function openPlanSheet(row: CookbookHistoryItem, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setSelectedItem(row)
    setSheetOpen(true)
  }

  const sheetDescription =
    selectedItem != null
      ? `${selectedItem.mealType} · ${selectedItem.cookedCount} gang(er) registrert`
      : undefined

  return (
    <section className="p-4" aria-labelledby="book-heading">
      <div className="space-y-1">
        <h1 id="book-heading" className="font-heading text-xl font-semibold tracking-tight">
          Kokebok
        </h1>
        <p className="text-sm text-muted-foreground">
          Måltider husstanden har laget etter fullførte handleturer.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <Label htmlFor={BOOK_SEARCH_ID} className="text-foreground">
          Søk
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={BOOK_SEARCH_ID}
            type="search"
            autoComplete="off"
            placeholder="Oppskrift eller måltidstype"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div
          className="flex min-w-0 flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrer etter måltidstype"
        >
          <Button
            type="button"
            size="sm"
            variant={mealTypeId == null ? "default" : "outline"}
            className="shrink-0"
            aria-pressed={mealTypeId == null}
            onClick={() => setMealTypeId(null)}
          >
            Alle
          </Button>
          {categoriesQuery.isLoading ? (
            <span className="text-xs text-muted-foreground">Laster…</span>
          ) : null}
          {planningMealCategories.map((c) => {
            const selected = mealTypeId === c.id
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                className="max-w-[9rem] shrink truncate"
                aria-pressed={selected}
                aria-label={`Måltidstype ${c.navn}${selected ? ", valgt" : ""}`}
                onClick={() => setMealTypeId(selected ? null : c.id)}
              >
                {c.navn}
              </Button>
            )
          })}
        </div>

        <div
          className="flex shrink-0 gap-1 rounded-xl border border-border p-1"
          role="group"
          aria-label="Sortering"
        >
          <Button
            type="button"
            size="sm"
            variant={sort === "ratingThenRecent" ? "secondary" : "ghost"}
            className="h-8 px-2 text-xs"
            aria-pressed={sort === "ratingThenRecent"}
            onClick={() => setSort("ratingThenRecent")}
          >
            Anbefalt
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === "recent" ? "secondary" : "ghost"}
            className="h-8 px-2 text-xs"
            aria-pressed={sort === "recent"}
            onClick={() => setSort("recent")}
          >
            Nyeste
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        {cookbookQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-foreground">Kunne ikke laste kokeboken.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cookbookQuery.error instanceof Error ? cookbookQuery.error.message : "Ukjent feil"}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => void cookbookQuery.refetch()}
            >
              Prøv igjen
            </Button>
          </div>
        ) : null}

        {cookbookQuery.isFetching && items == null ? (
          <ul className="space-y-3" aria-label="Laster kokebok">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-[5.75rem] animate-pulse rounded-2xl border border-border bg-muted/80"
              />
            ))}
          </ul>
        ) : null}

        {emptyCookbook ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6">
            <div className="flex flex-col items-center text-center">
              <ShoppingBasket className="size-10 text-muted-foreground" aria-hidden />
              <p className="mt-4 text-sm font-medium text-foreground">Ingen måltider i kokeboken ennå</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Fullfør en handletur med oppskriftsvarer fra ukeplanen. Da dukker måltidene opp her så
                dere kan lage dem igjen.
              </p>
              <Link
                to="/app/shop"
                className={cn(buttonVariants({ variant: "default" }), "mt-5 inline-flex w-full max-w-xs justify-center no-underline")}
              >
                Gå til handleliste
              </Link>
              <Link
                to="/app/plan"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "mt-2 inline-flex w-full max-w-xs justify-center no-underline",
                )}
              >
                Åpne ukeplan
              </Link>
            </div>
          </div>
        ) : null}

        {noResults ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">Ingen treff</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Prøv et annet søk eller fjern måltidsfilteret.
            </p>
            <Button type="button" className="mt-4" variant="secondary" onClick={clearFilters}>
              Nullstill søk og filter
            </Button>
          </div>
        ) : null}

        {items != null && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((row) => (
              <li key={`${row.recipeId}-${row.mealTypeId}`}>
                <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h2 className="text-base font-semibold leading-snug text-foreground">
                        {row.recipeName}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{row.mealType}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                        <span>Sist laget {formatLastCookedNb(row.lastCookedAt)}</span>
                      </span>
                      <span aria-label={`Lagt ${row.cookedCount} gang(er)`}>
                        · {row.cookedCount}× laget
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Star
                        className="mt-0.5 size-4 shrink-0 text-foreground"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <span className="text-muted-foreground">
                        {row.currentUserRating != null ? (
                          <>
                            <span className="sr-only">Din vurdering:</span>
                            <span aria-hidden>Din vurdering: </span>
                            <span className="font-medium text-foreground">{row.currentUserRating}</span>
                            <span className="text-muted-foreground"> av 10</span>
                          </>
                        ) : (
                          <span className="text-foreground">Ikke vurdert ennå</span>
                        )}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={(e) => openPlanSheet(row, e.currentTarget)}
                    >
                      Planlegg på nytt
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setSelectedItem(null)
        }}
        labelledById="book-add-plan-sheet-title"
        title={selectedItem?.recipeName ?? "Legg i plan"}
        description={sheetDescription}
        returnFocusRef={returnFocusRef}
        footer={
          selectedItem != null ? (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={createPlannedMealMutation.isPending}
                onClick={() => setSheetOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                form={BOOK_PLAN_FORM_ID}
                className="flex-1"
                size="lg"
                disabled={createPlannedMealMutation.isPending}
              >
                Lagre i plan
              </Button>
            </div>
          ) : null
        }
      >
        {selectedItem != null ? (
          <AddToPlanPanel
            key={`${selectedItem.recipeId}-${selectedItem.mealTypeId}`}
            formId={BOOK_PLAN_FORM_ID}
            recipeId={selectedItem.recipeId}
            recipePortions={selectedItem.recipePortions}
            householdMemberCount={householdMemberCount}
            mealCategories={planningMealCategories}
            createMutation={createPlannedMealMutation}
            onSaved={() => {
              toast.success("Lagret i ukeplan.")
              setSheetOpen(false)
              setSelectedItem(null)
            }}
          />
        ) : null}
      </DetailSheet>
    </section>
  )
}
