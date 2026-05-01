import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { RouteHeader } from "~/components/route-header"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { SearchFilterPopover } from "~/components/search-filter-popover"
import { Button } from "~/components/ui/button"
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
import type { RecipeListFilters } from "~/features/recipes/use-recipes"
import {
  useDebouncedValue,
  useRecipe,
  useRecipeCategories,
  useRecipes,
} from "~/features/recipes/use-recipes"

const EXCLUDED_FILTER_CATEGORY_IDS = new Set([4, 5, 6])

const CHEF_PLAN_FORM_ID = "chef-add-plan-form"

export default function ChefRoute() {
  const { t } = useTranslation()
  const searchInputId = "chef-recipe-search"
  const detailTitleId = "chef-recipe-detail-title"

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const trimmed = debouncedSearch.trim()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetTitle, setSheetTitle] = useState("")
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const householdQuery = useHousehold()
  const createPlannedMealMutation = useCreatePlannedMeal()

  const categoriesQuery = useRecipeCategories()
  const detailQuery = useRecipe(selectedId, sheetOpen && selectedId != null)

  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const filterCategories = useMemo(() => {
    if (!categoriesQuery.data) return []
    return categoriesQuery.data.filter(
      (c) => !EXCLUDED_FILTER_CATEGORY_IDS.has(c.id)
    )
  }, [categoriesQuery.data])

  const kategoriIdFromUrl = useMemo(() => {
    const raw = searchParams.get("kategoriId")
    if (raw == null || raw === "") return null
    const n = Number(raw)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null
    return n
  }, [searchParams])

  const initialDayFromUrl = useMemo(() => {
    const raw = searchParams.get("day")
    if (raw == null || raw === "") return null
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 1 || n > 7) return null
    return n
  }, [searchParams])

  const initialWeekStartFromUrl = useMemo(() => {
    const raw = searchParams.get("weekStart")
    if (raw == null || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
    return raw
  }, [searchParams])

  const kategoriId = useMemo(() => {
    if (kategoriIdFromUrl == null) return null
    if (filterCategories.length === 0) return kategoriIdFromUrl
    return filterCategories.some((c) => c.id === kategoriIdFromUrl)
      ? kategoriIdFromUrl
      : null
  }, [kategoriIdFromUrl, filterCategories])

  useEffect(() => {
    if (categoriesQuery.isLoading) return
    if (kategoriIdFromUrl == null) return
    if (filterCategories.length === 0) return
    if (kategoriId != null) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete("kategoriId")
        return next
      },
      { replace: true }
    )
  }, [
    categoriesQuery.isLoading,
    filterCategories.length,
    kategoriId,
    kategoriIdFromUrl,
    setSearchParams,
  ])

  function setKategoriId(next: number | null) {
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        if (next == null) nextParams.delete("kategoriId")
        else nextParams.set("kategoriId", String(next))
        return nextParams
      },
      { replace: true }
    )
  }

  const filters: RecipeListFilters = useMemo(
    () => ({
      search: trimmed.length > 0 ? trimmed : null,
      kategoriId,
    }),
    [trimmed, kategoriId]
  )

  const recipesQuery = useRecipes(filters)

  const planningCategoriesForChef = useMemo(() => {
    const raw = categoriesQuery.data ?? []
    const filtered = sortPlanningCategories(
      raw.filter((c) => PLANNING_MEAL_TYPE_IDS.has(c.id))
    )
    if (filtered.length > 0) return filtered
    return PLANNING_MEAL_TYPE_ORDER.map((id) => ({
      id,
      navn: PLANNING_MEAL_FALLBACK_NAVN[id] ?? t("common.mealFallback", { id }),
    }))
  }, [categoriesQuery.data, t])

  const hasActiveFilters = trimmed.length > 0 || kategoriId != null
  const listEmpty =
    recipesQuery.data != null &&
    recipesQuery.data.length === 0 &&
    !recipesQuery.isFetching

  const detailTitle = detailQuery.data?.navn ?? sheetTitle
  const detailDescription =
    detailQuery.data != null
      ? [detailQuery.data.kategori, `${detailQuery.data.porsjoner} porsjoner`]
          .filter(Boolean)
          .join(" · ")
      : undefined

  function openRecipe(id: number, title: string, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger
    setSelectedId(id)
    setSheetTitle(title)
    setSheetOpen(true)
  }

  function clearFilters() {
    setSearch("")
    setKategoriId(null)
  }

  const householdMemberCount = householdQuery.data?.medlemmer.length ?? null

  return (
    <section className="px-4 pb-4" aria-label={t("chef.title")}>
      <RouteHeader
        title={t("chef.heading")}
        action={
          <SearchFilterPopover
            open={panelOpen}
            onOpenChange={setPanelOpen}
            hasActiveFilters={hasActiveFilters}
            searchId={searchInputId}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("chef.searchPlaceholder")}
            searchAriaLabel={t("chef.searchInRecipes")}
            categories={filterCategories}
            selectedCategoryId={kategoriId}
            onSelectCategoryId={setKategoriId}
            categoryGroupAriaLabel={t("chef.filterMealType")}
            allLabel={t("chef.all")}
            chipAriaTemplate={(args) => t("chef.filterChipAria", args)}
            chipAriaType={t("chef.filterChipType")}
            selectedChipSuffix={t("chef.filterSelectedSuffix")}
            categoriesLoading={categoriesQuery.isLoading}
            categoriesLoadingLabel={t("chef.loadingFilters")}
            triggerAriaLabel={t("chef.searchInRecipes")}
          />
        }
      />

      <div className="mx-auto mt-6 max-w-2xl space-y-3" aria-live="polite">
        {recipesQuery.isError ? (
          <RouteErrorRetry
            title={t("chef.loadError")}
            hint={t("common.networkHint")}
            retryLabel={t("common.retry")}
            busy={recipesQuery.isFetching}
            onRetry={() => void recipesQuery.refetch()}
          />
        ) : null}

        {recipesQuery.isFetching && recipesQuery.data == null ? (
          <ul
            className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2"
            aria-label={t("chef.loadingListLabel")}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="h-[5.5rem] animate-pulse rounded-2xl border border-border bg-muted/80 min-[400px]:h-[13rem]"
              />
            ))}
          </ul>
        ) : null}

        {listEmpty ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              {t("chef.noHits")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? t("chef.noHitsFiltered")
                : t("chef.noRecipesYet")}
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                className="mt-4"
                variant="secondary"
                onClick={clearFilters}
              >
                {t("chef.clearFilters")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {recipesQuery.data != null && recipesQuery.data.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            {recipesQuery.data.map((r) => (
              <li key={r.id}>
                <RecipeCard
                  recipe={r}
                  onClick={(e) => openRecipe(r.id, r.navn, e.currentTarget)}
                />
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
            setSelectedId(null)
            setShowPlanForm(false)
          }
        }}
        labelledById={detailTitleId}
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
                form={CHEF_PLAN_FORM_ID}
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
              {t("book.addToPlan")}
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
            formId={CHEF_PLAN_FORM_ID}
            recipeId={detailQuery.data.id}
            recipePortions={detailQuery.data.porsjoner}
            householdMemberCount={householdMemberCount}
            mealCategories={planningCategoriesForChef}
            initialDay={initialDayFromUrl}
            initialWeekStart={initialWeekStartFromUrl}
            initialMealTypeId={kategoriIdFromUrl}
            createMutation={createPlannedMealMutation}
            onSaved={() => {
              toast.success(t("book.planSavedToast"))
              setSheetOpen(false)
              setShowPlanForm(false)
              setSelectedId(null)
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
