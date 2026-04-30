import { useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const trimmed = debouncedSearch.trim()
  const [kategoriId, setKategoriId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetTitle, setSheetTitle] = useState("")
  const [showPlanForm, setShowPlanForm] = useState(false)

  const householdQuery = useHousehold()
  const createPlannedMealMutation = useCreatePlannedMeal()

  const filters: RecipeListFilters = useMemo(
    () => ({
      search: trimmed.length > 0 ? trimmed : null,
      kategoriId,
    }),
    [trimmed, kategoriId],
  )

  const categoriesQuery = useRecipeCategories()
  const recipesQuery = useRecipes(filters)
  const detailQuery = useRecipe(selectedId, sheetOpen && selectedId != null)

  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const filterCategories = useMemo(() => {
    if (!categoriesQuery.data) return []
    return categoriesQuery.data.filter((c) => !EXCLUDED_FILTER_CATEGORY_IDS.has(c.id))
  }, [categoriesQuery.data])

  const planningCategoriesForChef = useMemo(() => {
    const raw = categoriesQuery.data ?? []
    const filtered = sortPlanningCategories(raw.filter((c) => PLANNING_MEAL_TYPE_IDS.has(c.id)))
    if (filtered.length > 0) return filtered
    return PLANNING_MEAL_TYPE_ORDER.map((id) => ({
      id,
      navn: PLANNING_MEAL_FALLBACK_NAVN[id] ?? t("common.mealFallback", { id }),
    }))
  }, [categoriesQuery.data, t])

  const hasActiveFilters = trimmed.length > 0 || kategoriId != null
  const listEmpty =
    recipesQuery.data != null && recipesQuery.data.length === 0 && !recipesQuery.isFetching

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
    <section className="p-4" aria-labelledby="chef-heading">
      <div className="space-y-1">
        <h1 id="chef-heading" className="font-heading text-xl font-semibold tracking-tight">
          {t("chef.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("chef.subtitle")}</p>
      </div>

      <div className="mt-6 space-y-3">
        <Label htmlFor={searchInputId} className="text-foreground">
          {t("chef.searchInRecipes")}
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchInputId}
            type="search"
            autoComplete="off"
            placeholder={t("chef.searchPlaceholder")}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("chef.filterMealType")}
        >
          <Button
            type="button"
            size="sm"
            variant={kategoriId == null ? "default" : "outline"}
            aria-pressed={kategoriId == null}
            onClick={() => setKategoriId(null)}
          >
            {t("chef.all")}
          </Button>
          {categoriesQuery.isLoading ? (
            <span className="text-xs text-muted-foreground">{t("chef.loadingFilters")}</span>
          ) : null}
          {filterCategories.map((c) => {
            const selected = kategoriId === c.id
            const chipSuffix = selected ? t("chef.filterSelectedSuffix") : ""
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                aria-label={t("chef.filterChipAria", {
                  type: t("chef.filterChipType"),
                  name: c.navn,
                  selectedSuffix: chipSuffix,
                })}
                onClick={() => setKategoriId(selected ? null : c.id)}
              >
                {c.navn}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
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
          <ul className="space-y-3" aria-label={t("chef.loadingListLabel")}>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-[5.5rem] animate-pulse rounded-2xl border border-border bg-muted/80"
              />
            ))}
          </ul>
        ) : null}

        {listEmpty ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground">{t("chef.noHits")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters ? t("chef.noHitsFiltered") : t("chef.noRecipesYet")}
            </p>
            {hasActiveFilters ? (
              <Button type="button" className="mt-4" variant="secondary" onClick={clearFilters}>
                {t("chef.clearFilters")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {recipesQuery.data != null && recipesQuery.data.length > 0 ? (
          <ul className="space-y-3">
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
          <div className="space-y-4 py-2" aria-busy="true" aria-label={t("chef.loadingDetailLabel")}>
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        ) : null}
        {detailQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4" role="alert">
            <p className="text-sm font-medium text-foreground">{t("chef.detailLoadError")}</p>
            <Button type="button" size="sm" className="mt-3" onClick={() => void detailQuery.refetch()}>
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
