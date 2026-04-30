import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react"
import { Link } from "react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { SwipeActionRow } from "~/components/SwipeActionRow"
import { DetailSheet } from "~/components/detail-sheet"
import { RouteErrorRetry } from "~/components/route-error-retry"
import { Button, buttonVariants } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import {
  PLANNING_MEAL_FALLBACK_NAVN,
  PLANNING_MEAL_TYPE_IDS,
  PLANNING_MEAL_TYPE_ORDER,
  sortPlanningCategories,
} from "~/features/planning/constants"
import type {
  PlannedMealDto,
  PlannedMealIngredientDto,
} from "~/features/planning/types"
import {
  useDeletePlannedMeal,
  useExcludePlannedMealIngredient,
  usePlannedMeals,
  useRestorePlannedMealIngredient,
  useUpdatePlannedMealServings,
} from "~/features/planning/use-planned-meals"
import { useRecipeCategories } from "~/features/recipes/use-recipes"
import type {
  GenerateShoppingSuggestionsResponse,
  ShoppingSuggestionDto,
} from "~/features/shopping/types"
import { useConfirmShoppingSuggestions } from "~/features/shopping/use-confirm-shopping-suggestions"
import { useGenerateShoppingSuggestions } from "~/features/shopping/use-shopping-suggestions"
import { ApiError } from "~/lib/api-fetch"
import {
  addWeeksToMondayKey,
  expandWeekFromMonday,
  formatWeekRangeTitle,
  getMondayKeyContaining,
  weekdayShort,
} from "~/lib/dates"
import { getDateLocaleTag } from "~/lib/i18n"
import { cn } from "~/lib/utils"

const EDIT_FORM_ID = "plan-edit-servings-form"

function clampServings(n: number): number {
  return Math.min(20, Math.max(1, Math.round(n)))
}

function formatSuggestionQtyLine(s: ShoppingSuggestionDto): string {
  if (s.kvantitet == null) return ""
  const qty = String(s.kvantitet)
    .replace(/\.00$/, "")
    .replace(/(\.\d*?)0+$/, "$1")
  const unit = (s.maaleenhet ?? "").trim()
  return [qty, unit].filter(Boolean).join(" ")
}

function suggestionCheckboxAriaLabel(s: ShoppingSuggestionDto, t: TFunction) {
  const qtyPart = formatSuggestionQtyLine(s)
  const head = qtyPart ? `${qtyPart} ${s.varetype}` : s.varetype
  return s.alreadyOnList
    ? `${head}${t("plan.suggestionCheckboxAlready")}`
    : head
}

function formatIngredientLine(ing: PlannedMealIngredientDto): string {
  const qty =
    ing.kvantitet != null
      ? String(ing.kvantitet)
          .replace(/\.00$/, "")
          .replace(/(\.\d*?)0+$/, "$1")
      : ""
  const unit = (ing.maaleenhet ?? "").trim()
  const head = [qty, unit].filter(Boolean).join(" ").trim()
  const base = ing.varetype?.trim() ?? ""
  return head ? `${head} · ${base}` : base
}

export default function PlanRoute() {
  const { t, i18n } = useTranslation()
  const dateLoc = getDateLocaleTag(i18n.language)
  const weekTitle = (mondayKey: string) =>
    formatWeekRangeTitle(mondayKey, dateLoc)
  const wdShort = (dayNumber: number) => weekdayShort(dayNumber, dateLoc)
  const [weekMonday, setWeekMonday] = useState(() => getMondayKeyContaining())
  const mealsQuery = usePlannedMeals(weekMonday)
  const categoriesQuery = useRecipeCategories()
  const updateServingsMutation = useUpdatePlannedMealServings()
  const excludeIngredientMutation = useExcludePlannedMealIngredient()
  const restoreIngredientMutation = useRestorePlannedMealIngredient()
  const deletePlannedMealMutation = useDeletePlannedMeal()
  const generateShoppingSuggestions = useGenerateShoppingSuggestions()
  const confirmShoppingSuggestions = useConfirmShoppingSuggestions()

  const [editingMeal, setEditingMeal] = useState<PlannedMealDto | null>(null)
  const [editServingsValue, setEditServingsValue] = useState(4)
  const [editError, setEditError] = useState<string | null>(null)
  const [sheetStep, setSheetStep] = useState<"edit" | "confirmRemove">("edit")
  const [deleteProtectedReason, setDeleteProtectedReason] = useState<
    string | null
  >(null)

  const [suggestionReviewOpen, setSuggestionReviewOpen] = useState(false)
  const [suggestionReview, setSuggestionReview] =
    useState<GenerateShoppingSuggestionsResponse | null>(null)
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<
    Set<string>
  >(() => new Set())

  const planningCategories = useMemo(() => {
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

  const weekDays = useMemo(() => expandWeekFromMonday(weekMonday), [weekMonday])

  const editingMealId = editingMeal?.id

  useEffect(() => {
    if (editingMealId == null) return
    setEditError(null)
    setSheetStep("edit")
    setDeleteProtectedReason(null)
  }, [editingMealId])

  useEffect(() => {
    if (!editingMeal) return
    setEditServingsValue(editingMeal.servings)
  }, [editingMeal?.id, editingMeal?.servings])

  useEffect(() => {
    if (editingMealId == null || mealsQuery.data == null) return
    const fresh = mealsQuery.data.find((m) => m.id === editingMealId)
    if (fresh) setEditingMeal(fresh)
    else setEditingMeal(null)
  }, [mealsQuery.data, editingMealId])

  function mealForSlot(
    dayNumber: number,
    mealTypeId: number
  ): PlannedMealDto | undefined {
    return mealsQuery.data?.find(
      (m) => m.day === dayNumber && m.mealTypeId === mealTypeId
    )
  }

  async function submitServingsEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMeal) return
    setEditError(null)
    try {
      await updateServingsMutation.mutateAsync({
        id: editingMeal.id,
        servings: clampServings(editServingsValue),
        weekStartDate: editingMeal.weekStartDate,
      })
      toast.success(t("plan.toastServingsUpdated"))
      setEditingMeal(null)
    } catch {
      setEditError(t("plan.toastSaveServingsFailed"))
    }
  }

  function bumpEdit(delta: number) {
    setEditServingsValue((s) => clampServings(s + delta))
  }

  async function toggleIngredientExcluded(ing: PlannedMealIngredientDto) {
    if (!editingMeal) return
    try {
      if (ing.excluded) {
        await restoreIngredientMutation.mutateAsync({
          plannedMealId: editingMeal.id,
          ingrediensId: ing.id,
          weekStartDate: editingMeal.weekStartDate,
        })
        toast.success(t("plan.toastIngredientRestored"))
      } else {
        await excludeIngredientMutation.mutateAsync({
          plannedMealId: editingMeal.id,
          ingrediensId: ing.id,
          weekStartDate: editingMeal.weekStartDate,
        })
        toast.success(t("plan.toastIngredientExcluded"))
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t("plan.toastIngredientToggleFailed")
          : t("common.genericError")
      )
    }
  }

  function ingredientRowPending(ing: PlannedMealIngredientDto): boolean {
    if (!editingMeal) return false
    const ex =
      excludeIngredientMutation.isPending &&
      excludeIngredientMutation.variables?.plannedMealId === editingMeal.id &&
      excludeIngredientMutation.variables?.ingrediensId === ing.id
    const re =
      restoreIngredientMutation.isPending &&
      restoreIngredientMutation.variables?.plannedMealId === editingMeal.id &&
      restoreIngredientMutation.variables?.ingrediensId === ing.id
    return Boolean(ex || re)
  }

  async function runGenerateShoppingSuggestions() {
    try {
      const res = await generateShoppingSuggestions.mutateAsync({
        weekStartDate: weekMonday,
      })
      const initial = new Set(
        res.suggestions
          .filter((s) => s.selectedByDefault)
          .map((s) => s.clientId)
      )
      setSelectedSuggestionIds(initial)
      setSuggestionReview(res)
      setSuggestionReviewOpen(true)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t("plan.toastSuggestionsFailed")
          : t("common.genericError")
      )
    }
  }

  async function submitConfirmedSuggestions() {
    if (!suggestionReview) return
    const ids = suggestionReview.suggestions
      .filter((s) => selectedSuggestionIds.has(s.clientId))
      .map((s) => s.clientId)
    if (ids.length === 0) return
    try {
      const res = await confirmShoppingSuggestions.mutateAsync({
        weekStartDate: suggestionReview.weekStartDate,
        selectedClientIds: ids,
      })
      const skipped = res.skippedAlreadyOnListCount
      if (res.addedCount > 0) {
        toast.success(
          res.addedCount === 1
            ? t("plan.toastAddedOneItem")
            : t("plan.toastAddedNItems", { count: res.addedCount }),
          skipped > 0
            ? {
                description:
                  skipped === 1
                    ? t("plan.toastSkippedDupOne")
                    : t("plan.toastSkippedDupN", { count: skipped }),
              }
            : undefined
        )
      } else if (skipped > 0) {
        toast.success(t("plan.toastNoNewTitle"), {
          description:
            skipped === 1 ? t("plan.toastNoNewOne") : t("plan.toastNoNewN"),
        })
      } else {
        toast.success(t("plan.toastNoChanges"))
      }
      setSuggestionReviewOpen(false)
      setSuggestionReview(null)
      setSelectedSuggestionIds(new Set())
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t("plan.toastShoppingConfirmFailed")
          : t("common.genericError")
      )
    }
  }

  function toggleSuggestionSelected(clientId: string, checked: boolean) {
    setSelectedSuggestionIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(clientId)
      else next.delete(clientId)
      return next
    })
  }

  async function confirmRemovePlannedMeal() {
    if (!editingMeal) return
    setDeleteProtectedReason(null)
    try {
      await deletePlannedMealMutation.mutateAsync({
        id: editingMeal.id,
        weekStartDate: editingMeal.weekStartDate,
      })
      toast.success(t("plan.toastMealRemoved"))
      setEditingMeal(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteProtectedReason(t("plan.removeProtectedReason"))
        return
      }
      toast.error(
        err instanceof ApiError
          ? t("plan.toastRemoveMealFailed")
          : t("common.genericError")
      )
    }
  }

  const editTitleId = "plan-edit-meal-title"
  const suggestionTitleId = "plan-shopping-suggestions-title"
  const ingredients = editingMeal?.ingredients ?? []

  const selectedSuggestionCount = selectedSuggestionIds.size

  const suggestionSheetDescription =
    suggestionReview == null
      ? undefined
      : `${weekTitle(suggestionReview.weekStartDate)} · ${
          suggestionReview.plannedMealCount === 1
            ? t("plan.plannedMealOne")
            : t("plan.plannedMealN", {
                count: suggestionReview.plannedMealCount,
              })
        } · ${
          suggestionReview.suggestions.length === 1
            ? `1 ${t("shop.rowSingular")}`
            : `${suggestionReview.suggestions.length} ${t("shop.rowPlural")}`
        }`

  return (
    <section className="p-4 pb-28" aria-labelledby="plan-heading">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              id="plan-heading"
              className="font-heading text-xl font-semibold tracking-tight"
            >
              {t("plan.title")}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("plan.mondayLine", { date: weekMonday })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={t("plan.prevWeek")}
              onClick={() => setWeekMonday((k) => addWeeksToMondayKey(k, -1))}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Button>
            <p className="min-w-[10rem] flex-1 text-center text-sm font-medium tabular-nums">
              {weekTitle(weekMonday)}
            </p>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={t("plan.nextWeek")}
              onClick={() => setWeekMonday((k) => addWeeksToMondayKey(k, 1))}
            >
              <ChevronRight className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
        {mealsQuery.data != null && mealsQuery.data.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={
                generateShoppingSuggestions.isPending || mealsQuery.isFetching
              }
              aria-busy={generateShoppingSuggestions.isPending}
              onClick={() => void runGenerateShoppingSuggestions()}
            >
              {generateShoppingSuggestions.isPending
                ? t("plan.generating")
                : t("plan.generateSuggestions")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("plan.generateHint")}
            </span>
          </div>
        ) : null}
      </header>

      <div className="mt-6 space-y-4" aria-live="polite">
        {mealsQuery.isError ? (
          <RouteErrorRetry
            title={t("plan.loadError")}
            hint={t("plan.loadErrorHint")}
            retryLabel={t("common.retry")}
            busy={mealsQuery.isFetching}
            onRetry={() => void mealsQuery.refetch()}
          />
        ) : null}

        {mealsQuery.isFetching && mealsQuery.data == null ? (
          <ul className="space-y-3" aria-label={t("plan.loading")}>
            {[0, 1, 2, 3, 4].map((i) => (
              <li
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border bg-muted/80"
              />
            ))}
          </ul>
        ) : null}

        {mealsQuery.data != null ? (
          <ul className="space-y-4">
            {weekDays.map((d) => {
              const dom = Number(d.dateKey.slice(8, 10))
              const wd = wdShort(d.dayNumber)
              return (
                <li key={d.dateKey}>
                  <article className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground">
                      {wd} {dom}.
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {planningCategories.map((mt) => {
                        const meal = mealForSlot(d.dayNumber, mt.id)
                        const ariaEmpty = t("plan.addSlotAria", {
                          meal: mt.navn,
                          day: wd,
                        })
                        if (!meal) {
                          return (
                            <li key={mt.id}>
                              <Link
                                to="/app/chef"
                                aria-label={ariaEmpty}
                                className={cn(
                                  buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  }),
                                  "h-auto min-h-11 w-full justify-start px-3 py-2 text-left font-normal"
                                )}
                              >
                                <span className="text-muted-foreground">
                                  {mt.navn} ·{" "}
                                </span>
                                <span>{t("plan.slotEmptyLine")}</span>
                              </Link>
                            </li>
                          )
                        }
                        const ariaEdit = t("plan.editMealAria", {
                          recipe: meal.oppskriftNavn,
                          type: meal.mealType,
                        })
                        return (
                          <li key={mt.id}>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-auto min-h-11 w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-normal"
                              aria-label={ariaEdit}
                              onClick={() => setEditingMeal(meal)}
                            >
                              <span className="text-xs text-muted-foreground">
                                {meal.mealType}
                              </span>
                              <span className="font-medium text-foreground">
                                {meal.oppskriftNavn}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t("plan.servings", { n: meal.servings })}
                              </span>
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </article>
                </li>
              )
            })}
          </ul>
        ) : null}

        {!mealsQuery.isFetching &&
        mealsQuery.data != null &&
        mealsQuery.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5">
            <h2 className="text-base font-semibold text-foreground">
              {t("plan.emptyWeekTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("plan.emptyWeekBody")}
            </p>
            <Link
              to="/app/chef"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-4 inline-flex w-full justify-center sm:w-auto"
              )}
            >
              {t("plan.emptyWeekCta")}
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("plan.emptyBefore")}{" "}
              <Link className="underline underline-offset-2" to="/app/chef">
                {t("plan.emptyChef")}
              </Link>
              .
            </p>
          </div>
        ) : null}
      </div>

      <DetailSheet
        open={editingMeal != null}
        onOpenChange={(open) => {
          if (!open) setEditingMeal(null)
        }}
        labelledById={editTitleId}
        title={editingMeal ? editingMeal.oppskriftNavn : t("plan.editMeal")}
        description={
          editingMeal
            ? `${wdShort(editingMeal.day)} · ${editingMeal.mealType}`
            : undefined
        }
        footer={
          editingMeal ? (
            <div className="flex w-full gap-2">
              {sheetStep === "confirmRemove" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={deletePlannedMealMutation.isPending}
                    onClick={() => {
                      setSheetStep("edit")
                      setDeleteProtectedReason(null)
                    }}
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={deletePlannedMealMutation.isPending}
                    onClick={() => void confirmRemovePlannedMeal()}
                  >
                    {deletePlannedMealMutation.isPending
                      ? t("plan.removing")
                      : t("plan.confirmRemoval")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingMeal(null)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    form={EDIT_FORM_ID}
                    className="flex-1"
                    disabled={updateServingsMutation.isPending}
                  >
                    {t("common.save")}
                  </Button>
                </>
              )}
            </div>
          ) : null
        }
      >
        {editingMeal && sheetStep === "edit" ? (
          <>
            <form
              id={EDIT_FORM_ID}
              className="space-y-4"
              onSubmit={(e) => void submitServingsEdit(e)}
            >
              <div>
                <Label htmlFor="plan-edit-servings-display">
                  {t("plan.servingsLabel")}
                </Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("plan.decreaseServing")}
                    disabled={
                      editServingsValue <= 1 || updateServingsMutation.isPending
                    }
                    onClick={() => bumpEdit(-1)}
                  >
                    −
                  </Button>
                  <span
                    id="plan-edit-servings-display"
                    className="min-w-[2rem] text-center font-medium tabular-nums"
                    aria-live="polite"
                  >
                    {editServingsValue}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("plan.increaseServing")}
                    disabled={
                      editServingsValue >= 20 ||
                      updateServingsMutation.isPending
                    }
                    onClick={() => bumpEdit(1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              {editError ? (
                <p className="text-sm text-destructive" role="alert">
                  {editError}
                </p>
              ) : null}
              <button type="submit" className="sr-only" tabIndex={-1}>
                {t("plan.saveServings")}
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("plan.ingredientsTitle")}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {t("plan.swipeOrButtonHint")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("plan.ingredientsExplainer")}
              </p>
              <div className="mt-3 space-y-0">
                {ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("plan.noIngredients")}
                  </p>
                ) : (
                  ingredients.map((ing) => {
                    const pending = ingredientRowPending(ing)
                    const actionLabel = ing.excluded
                      ? t("plan.actionIncludeAgain")
                      : t("plan.actionHaveAlready")
                    const fallbackAria = ing.excluded
                      ? t("plan.ariaIncludeAgain", { item: ing.varetype })
                      : t("plan.ariaMarkHaveAlready", { item: ing.varetype })

                    return (
                      <SwipeActionRow
                        key={ing.id}
                        actionLabel={actionLabel}
                        fallbackAriaLabel={fallbackAria}
                        loading={pending}
                        disabled={pending}
                        onAction={() => void toggleIngredientExcluded(ing)}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="text-sm leading-snug font-medium break-words text-foreground">
                            {formatIngredientLine(ing)}
                          </span>
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {ing.valgfritt ? (
                              <span className="rounded-md border border-border px-1.5 py-0.5">
                                {t("plan.optionalIngredient")}
                              </span>
                            ) : null}
                            {ing.type === "tilbehor" ? (
                              <span className="rounded-md border border-border px-1.5 py-0.5">
                                {t("plan.sideDish")}
                              </span>
                            ) : null}
                            {ing.excluded ? (
                              <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-medium text-foreground">
                                {t("plan.statusHaveAtHome")}
                              </span>
                            ) : (
                              <span className="rounded-md border border-transparent px-1.5 py-0.5">
                                {t("plan.statusIncluded")}
                              </span>
                            )}
                          </div>
                        </div>
                      </SwipeActionRow>
                    )
                  })
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setSheetStep("confirmRemove")}
              >
                {t("plan.removeMealFromWeek")}
              </Button>
            </div>
          </>
        ) : null}

        {editingMeal && sheetStep === "confirmRemove" ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              {t("plan.removeConfirmLead", {
                recipe: editingMeal.oppskriftNavn,
                week: weekTitle(editingMeal.weekStartDate),
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("plan.removeConfirmHint")}
            </p>
            {deleteProtectedReason ? (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                {deleteProtectedReason}
              </p>
            ) : null}
          </div>
        ) : null}
      </DetailSheet>

      <DetailSheet
        open={suggestionReviewOpen}
        onOpenChange={(open) => {
          setSuggestionReviewOpen(open)
          if (!open) {
            setSuggestionReview(null)
            setSelectedSuggestionIds(new Set())
          }
        }}
        labelledById={suggestionTitleId}
        title={t("plan.suggestionsReviewTitle")}
        description={suggestionSheetDescription}
        footer={
          suggestionReview ? (
            <div className="flex w-full flex-col gap-2">
              {selectedSuggestionCount === 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("plan.suggestionsPickOne")}
                </p>
              ) : null}
              <Button
                type="button"
                className="w-full"
                disabled={
                  selectedSuggestionCount === 0 ||
                  confirmShoppingSuggestions.isPending ||
                  generateShoppingSuggestions.isPending
                }
                aria-busy={confirmShoppingSuggestions.isPending}
                onClick={() => void submitConfirmedSuggestions()}
              >
                {confirmShoppingSuggestions.isPending
                  ? t("plan.suggestionsAdding")
                  : selectedSuggestionCount === 0
                    ? t("plan.suggestionsAddToList")
                    : selectedSuggestionCount === 1
                      ? t("plan.suggestionsAddOne")
                      : t("plan.suggestionsAddN", {
                          count: selectedSuggestionCount,
                        })}
              </Button>
            </div>
          ) : null
        }
      >
        {suggestionReview ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("plan.suggestionsIntro")}
            </p>
            <ul className="space-y-2">
              {suggestionReview.suggestions.map((s, idx) => (
                <li key={s.clientId}>
                  <label
                    htmlFor={`plan-suggestion-${idx}`}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40",
                      s.alreadyOnList ? "border-dashed" : ""
                    )}
                  >
                    <Checkbox
                      id={`plan-suggestion-${idx}`}
                      className="mt-1 shrink-0"
                      checked={selectedSuggestionIds.has(s.clientId)}
                      onCheckedChange={(next) =>
                        toggleSuggestionSelected(s.clientId, next === true)
                      }
                      aria-label={suggestionCheckboxAriaLabel(s, t)}
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                        <span className="text-sm leading-snug font-medium text-foreground">
                          {s.varetype}
                        </span>
                        {s.alreadyOnList ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/80 px-1.5 py-0.5 text-xs font-medium text-foreground">
                            <ListChecks
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            {t("plan.duplicateOnListBadge")}
                          </span>
                        ) : null}
                      </div>
                      {s.kvantitet != null ? (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatSuggestionQtyLine(s)}
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                          {t("plan.suggestionNoQuantity")}
                        </p>
                      )}
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {t("plan.suggestionMeta", {
                          lines: s.sourceCount,
                          meals:
                            s.plannedMealIds.length === 1
                              ? t("plan.suggestionMealOne")
                              : t("plan.suggestionMealN", {
                                  count: s.plannedMealIds.length,
                                }),
                        })}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DetailSheet>
    </section>
  )
}
