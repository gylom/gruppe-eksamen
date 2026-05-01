import { useMemo, useRef, useState } from "react"
import { Link } from "react-router"
import { ShoppingBasket } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { Rating } from "~/components/rating"
import { RouteHeader } from "~/components/route-header"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { SearchFilterPopover } from "~/components/search-filter-popover"
import { cn } from "~/lib/utils"
import { Button, buttonVariants } from "~/components/ui/button"
import type { CookbookHistoryItem, CookbookSortMode } from "~/features/cookbook/types"
import { backendKarakterToStars, useSaveCookbookRating } from "~/features/cookbook/use-save-cookbook-rating"
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
import { RecipeCard } from "~/features/recipes/recipe-card"
import { RecipeDetailPanel } from "~/features/recipes/recipe-detail-panel"
import type { RecipeDto } from "~/features/recipes/types"
import { useDebouncedValue, useRecipe, useRecipeCategories } from "~/features/recipes/use-recipes"

const BOOK_SEARCH_ID = "book-cookbook-search"
const BOOK_PLAN_FORM_ID = "book-add-plan-form"
const BOOK_DETAIL_TITLE_ID = "book-detail-title"

function cookbookItemToRecipeCardProps(item: CookbookHistoryItem): RecipeDto {
  return {
    id: item.recipeId,
    navn: item.recipeName,
    instruksjoner: "",
    porsjoner: item.recipePortions,
    bilde: item.bilde,
    kategori_id: item.kategoriId,
    kategori: item.kategori,
    user_id: 0,
    karakter: null,
    kommentar: null,
    skjul: false,
    skjultBegrunnelse: null,
    ingredienser: [],
  }
}

function CookbookRowRating({ row }: { row: CookbookHistoryItem }) {
  const { t } = useTranslation()
  const saveRating = useSaveCookbookRating()
  const stars = backendKarakterToStars(row.currentUserRating)
  const summaryId = `book-rating-summary-${row.recipeId}-${row.mealTypeId}`

  return (
    <fieldset className="min-w-0 space-y-2 border-0 p-0">
      <legend className="sr-only">{t("book.ratingLegend", { recipe: row.recipeName })}</legend>
      <p id={summaryId} className="text-sm text-muted-foreground">
        {stars != null ? (
          <span className="font-medium text-foreground">{t("book.ratingLine", { n: stars })}</span>
        ) : (
          <span className="text-foreground">{t("book.notRated")}</span>
        )}
      </p>
      <Rating
        rate={stars ?? 0}
        disabled={saveRating.isPending}
        ariaLabelForStar={(step) => t("book.rateAria", { recipe: row.recipeName, step })}
        onRate={(step) =>
          saveRating.mutate(
            { recipeId: row.recipeId, stars: step },
            {
              onSuccess: () => toast.success(t("book.ratingSaved")),
              onError: () => toast.error(t("book.ratingError")),
            },
          )
        }
      />
    </fieldset>
  )
}

export default function BookRoute() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const trimmed = debouncedSearch.trim()
  const [mealTypeId, setMealTypeId] = useState<number | null>(null)
  const [sort, setSort] = useState<CookbookSortMode>("ratingThenRecent")
  const [panelOpen, setPanelOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CookbookHistoryItem | null>(null)
  const [showPlanForm, setShowPlanForm] = useState(false)

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
  const detailQuery = useRecipe(selectedItem?.recipeId ?? null, sheetOpen && selectedItem != null)

  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const planningMealCategories = useMemo(() => {
    const raw = categoriesQuery.data ?? []
    const filtered = sortPlanningCategories(raw.filter((c) => PLANNING_MEAL_TYPE_IDS.has(c.id)))
    if (filtered.length > 0) return filtered
    return PLANNING_MEAL_TYPE_ORDER.map((id) => ({
      id,
      navn: PLANNING_MEAL_FALLBACK_NAVN[id] ?? t("common.mealFallback", { id }),
    }))
  }, [categoriesQuery.data, t])

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

  function openDetailSheet(row: CookbookHistoryItem, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setSelectedItem(row)
    setShowPlanForm(false)
    setSheetOpen(true)
  }

  const detailTitle = detailQuery.data?.navn ?? selectedItem?.recipeName ?? t("book.addToPlan")
  const detailDescription =
    detailQuery.data != null
      ? [detailQuery.data.kategori, `${detailQuery.data.porsjoner} porsjoner`]
          .filter(Boolean)
          .join(" · ")
      : selectedItem != null
        ? t("book.sheetMeta", { mealType: selectedItem.mealType, count: selectedItem.cookedCount })
        : undefined

  return (
    <section className="px-4 pb-4" aria-labelledby="book-heading">
      <RouteHeader
        title={t("book.title")}
        titleId="book-heading"
        action={
          <SearchFilterPopover
            open={panelOpen}
            onOpenChange={setPanelOpen}
            hasActiveFilters={hasActiveFilters}
            searchId={BOOK_SEARCH_ID}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("book.searchPlaceholder")}
            searchAriaLabel={t("book.searchLabel")}
            categories={planningMealCategories}
            selectedCategoryId={mealTypeId}
            onSelectCategoryId={setMealTypeId}
            categoryGroupAriaLabel={t("book.filterMealType")}
            allLabel={t("book.all")}
            chipAriaTemplate={(args) => t("book.filterChipAria", args)}
            chipAriaType={t("book.filterChipType")}
            selectedChipSuffix={t("book.filterSelectedSuffix")}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesLoadingLabel={t("common.loading")}
            triggerAriaLabel={t("book.searchLabel")}
            extra={
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t("book.sortAria")}
              >
                <Button
                  type="button"
                  size="sm"
                  variant={sort === "ratingThenRecent" ? "default" : "outline"}
                  aria-pressed={sort === "ratingThenRecent"}
                  onClick={() => setSort("ratingThenRecent")}
                >
                  {t("book.sortRating")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sort === "recent" ? "default" : "outline"}
                  aria-pressed={sort === "recent"}
                  onClick={() => setSort("recent")}
                >
                  {t("book.sortRecent")}
                </Button>
              </div>
            }
          />
        }
      />

      <div className="mx-auto mt-6 max-w-2xl space-y-3" aria-live="polite">
        {cookbookQuery.isError ? (
          <RouteErrorRetry
            title={t("book.loadError")}
            hint={t("book.loadErrorHint")}
            retryLabel={t("common.retry")}
            busy={cookbookQuery.isFetching}
            onRetry={() => void cookbookQuery.refetch()}
          />
        ) : null}

        {cookbookQuery.isFetching && items == null ? (
          <ul
            className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2"
            aria-label={t("book.loadingCookbook")}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="h-[5.5rem] animate-pulse rounded-2xl border border-border bg-muted/80 min-[400px]:h-[13rem]"
              />
            ))}
          </ul>
        ) : null}

        {emptyCookbook ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6">
            <div className="flex flex-col items-center text-center">
              <ShoppingBasket className="size-10 text-muted-foreground" aria-hidden />
              <p className="mt-4 text-sm font-medium text-foreground">{t("book.emptyTitle")}</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("book.emptyHint")}</p>
              <Link
                to="/app/groceries"
                className={cn(buttonVariants({ variant: "default" }), "mt-5 inline-flex w-full max-w-xs justify-center no-underline")}
              >
                {t("book.emptyCta")}
              </Link>
              <Link
                to="/app/meals"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "mt-2 inline-flex w-full max-w-xs justify-center no-underline",
                )}
              >
                {t("shop.emptyGotoPlan")}
              </Link>
              <Link
                to="/app/recipes"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-2 inline-flex w-full max-w-xs justify-center no-underline",
                )}
              >
                {t("book.emptyChefLink")}
              </Link>
            </div>
          </div>
        ) : null}

        {noResults ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">{t("book.noHits")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("book.noHitsHint")}</p>
            <Button type="button" className="mt-4" variant="secondary" onClick={clearFilters}>
              {t("book.clearFilters")}
            </Button>
          </div>
        ) : null}

        {items != null && items.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            {items.map((row) => (
              <li
                key={`${row.recipeId}-${row.mealTypeId}`}
                className="flex flex-col gap-2"
              >
                <RecipeCard
                  recipe={cookbookItemToRecipeCardProps(row)}
                  onClick={(e) => openDetailSheet(row, e.currentTarget)}
                />
                <CookbookRowRating row={row} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <DetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setSelectedItem(null)
            setShowPlanForm(false)
          }
        }}
        labelledById={BOOK_DETAIL_TITLE_ID}
        title={detailTitle}
        description={detailDescription}
        returnFocusRef={returnFocusRef}
        footer={
          detailQuery.data != null && showPlanForm ? (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={createPlannedMealMutation.isPending}
                onClick={() => setShowPlanForm(false)}
              >
                {t("common.back")}
              </Button>
              <Button
                type="submit"
                form={BOOK_PLAN_FORM_ID}
                className="flex-1"
                size="lg"
                disabled={createPlannedMealMutation.isPending}
              >
                {t("common.saveToPlan")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={detailQuery.data == null}
              onClick={() => setShowPlanForm(true)}
            >
              {t("book.planAgain")}
            </Button>
          )
        }
      >
        {detailQuery.isLoading ? (
          <div
            className="space-y-4 py-2"
            aria-busy="true"
            aria-label={t("chef.loadingDetailLabel")}
          >
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        ) : null}
        {detailQuery.isError ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            role="alert"
          >
            <p className="text-sm font-medium text-foreground">
              {t("chef.detailLoadError")}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => void detailQuery.refetch()}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : null}
        {detailQuery.data != null && showPlanForm ? (
          <AddToPlanPanel
            key={detailQuery.data.id}
            formId={BOOK_PLAN_FORM_ID}
            recipeId={detailQuery.data.id}
            recipePortions={detailQuery.data.porsjoner}
            householdMemberCount={householdMemberCount}
            mealCategories={planningMealCategories}
            createMutation={createPlannedMealMutation}
            onSaved={() => {
              toast.success(t("book.planSavedToast"))
              setSheetOpen(false)
              setShowPlanForm(false)
              setSelectedItem(null)
            }}
          />
        ) : null}
        {detailQuery.data != null && !showPlanForm ? (
          <RecipeDetailPanel recipe={detailQuery.data} />
        ) : null}
      </DetailSheet>
    </section>
  )
}
