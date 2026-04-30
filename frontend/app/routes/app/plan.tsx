import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { SwipeActionRow } from "~/components/SwipeActionRow"
import { DetailSheet } from "~/components/detail-sheet"
import { Button, buttonVariants } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import {
  PLANNING_MEAL_FALLBACK_NAVN,
  PLANNING_MEAL_TYPE_IDS,
  PLANNING_MEAL_TYPE_ORDER,
  sortPlanningCategories,
} from "~/features/planning/constants"
import type { PlannedMealDto, PlannedMealIngredientDto } from "~/features/planning/types"
import {
  useDeletePlannedMeal,
  useExcludePlannedMealIngredient,
  usePlannedMeals,
  useRestorePlannedMealIngredient,
  useUpdatePlannedMealServings,
} from "~/features/planning/use-planned-meals"
import { useRecipeCategories } from "~/features/recipes/use-recipes"
import { useGenerateShoppingSuggestions } from "~/features/shopping/use-shopping-suggestions"
import { ApiError } from "~/lib/api-fetch"
import {
  addWeeksToMondayKey,
  expandWeekFromMonday,
  formatWeekRangeTitleNb,
  getMondayKeyContaining,
  weekdayShortNb,
} from "~/lib/dates"
import { cn } from "~/lib/utils"

const EDIT_FORM_ID = "plan-edit-servings-form"

function clampServings(n: number): number {
  return Math.min(20, Math.max(1, Math.round(n)))
}

function formatIngredientLine(ing: PlannedMealIngredientDto): string {
  const qty =
    ing.kvantitet != null
      ? String(ing.kvantitet).replace(/\.00$/, "").replace(/(\.\d*?)0+$/, "$1")
      : ""
  const unit = (ing.maaleenhet ?? "").trim()
  const head = [qty, unit].filter(Boolean).join(" ").trim()
  const base = ing.varetype?.trim() ?? ""
  return head ? `${head} · ${base}` : base
}

export default function PlanRoute() {
  const [weekMonday, setWeekMonday] = useState(() => getMondayKeyContaining())
  const mealsQuery = usePlannedMeals(weekMonday)
  const categoriesQuery = useRecipeCategories()
  const updateServingsMutation = useUpdatePlannedMealServings()
  const excludeIngredientMutation = useExcludePlannedMealIngredient()
  const restoreIngredientMutation = useRestorePlannedMealIngredient()
  const deletePlannedMealMutation = useDeletePlannedMeal()
  const generateShoppingSuggestions = useGenerateShoppingSuggestions()

  const [editingMeal, setEditingMeal] = useState<PlannedMealDto | null>(null)
  const [editServingsValue, setEditServingsValue] = useState(4)
  const [editError, setEditError] = useState<string | null>(null)
  const [sheetStep, setSheetStep] = useState<"edit" | "confirmRemove">("edit")
  const [deleteProtectedReason, setDeleteProtectedReason] = useState<string | null>(null)

  const planningCategories = useMemo(() => {
    const raw = categoriesQuery.data ?? []
    const filtered = sortPlanningCategories(raw.filter((c) => PLANNING_MEAL_TYPE_IDS.has(c.id)))
    if (filtered.length > 0) return filtered
    return PLANNING_MEAL_TYPE_ORDER.map((id) => ({
      id,
      navn: PLANNING_MEAL_FALLBACK_NAVN[id] ?? `Måltid ${id}`,
    }))
  }, [categoriesQuery.data])

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

  function mealForSlot(dayNumber: number, mealTypeId: number): PlannedMealDto | undefined {
    return mealsQuery.data?.find((m) => m.day === dayNumber && m.mealTypeId === mealTypeId)
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
      toast.success("Porsjoner oppdatert.")
      setEditingMeal(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Kunne ikke lagre."
      setEditError(msg)
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
        toast.success("Ingrediens er med i planen igjen.")
      } else {
        await excludeIngredientMutation.mutateAsync({
          plannedMealId: editingMeal.id,
          ingrediensId: ing.id,
          weekStartDate: editingMeal.weekStartDate,
        })
        toast.success("Markert som du har allerede.")
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Kunne ikke oppdatere ingrediens."
      toast.error(msg)
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
      const res = await generateShoppingSuggestions.mutateAsync({ weekStartDate: weekMonday })
      toast.success(
        `${res.suggestions.length} handleforslag fra ${res.plannedMealCount} måltid${res.plannedMealCount === 1 ? "" : "er"} (uke ${res.weekStartDate} — kun forslag, ikke lagret).`,
      )
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Kunne ikke generere forslag."
      toast.error(msg)
    }
  }

  async function confirmRemovePlannedMeal() {
    if (!editingMeal) return
    setDeleteProtectedReason(null)
    try {
      await deletePlannedMealMutation.mutateAsync({
        id: editingMeal.id,
        weekStartDate: editingMeal.weekStartDate,
      })
      toast.success("Måltid fjernet fra uken.")
      setEditingMeal(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteProtectedReason(err.message)
        return
      }
      const msg = err instanceof ApiError ? err.message : "Kunne ikke fjerne måltidet."
      toast.error(msg)
    }
  }

  const editTitleId = "plan-edit-meal-title"
  const ingredients = editingMeal?.ingredients ?? []

  return (
    <section className="p-4 pb-28" aria-labelledby="plan-heading">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="plan-heading" className="font-heading text-xl font-semibold tracking-tight">
              Ukeplan
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Mandag {weekMonday}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Previous week"
              onClick={() => setWeekMonday((k) => addWeeksToMondayKey(k, -1))}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Button>
            <p className="min-w-[10rem] flex-1 text-center text-sm font-medium tabular-nums">
              {formatWeekRangeTitleNb(weekMonday)}
            </p>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Next week"
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
              disabled={generateShoppingSuggestions.isPending || mealsQuery.isFetching}
              aria-busy={generateShoppingSuggestions.isPending}
              onClick={() => void runGenerateShoppingSuggestions()}
            >
              {generateShoppingSuggestions.isPending ? "Genererer…" : "Generer handleforslag"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Les fra denne ukens plan (lagrer ikke i handleliste ennå).
            </span>
          </div>
        ) : null}
      </header>

      <div className="mt-6 space-y-4" aria-live="polite">
        {mealsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-foreground">Kunne ikke laste ukeplan.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {mealsQuery.error instanceof Error ? mealsQuery.error.message : "Ukjent feil"}
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={() => void mealsQuery.refetch()}>
              Prøv igjen
            </Button>
          </div>
        ) : null}

        {mealsQuery.isFetching && mealsQuery.data == null ? (
          <ul className="space-y-3" aria-label="Laster ukeplan">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/80" />
            ))}
          </ul>
        ) : null}

        {mealsQuery.data != null ? (
          <ul className="space-y-4">
            {weekDays.map((d) => {
              const dom = Number(d.dateKey.slice(8, 10))
              const wd = weekdayShortNb(d.dayNumber)
              return (
                <li key={d.dateKey}>
                  <article className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground">
                      {wd} {dom}.
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {planningCategories.map((mt) => {
                        const meal = mealForSlot(d.dayNumber, mt.id)
                        const ariaEmpty = `Legg til ${mt.navn} på ${wd}`
                        if (!meal) {
                          return (
                            <li key={mt.id}>
                              <Link
                                to="/app/chef"
                                aria-label={ariaEmpty}
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "h-auto min-h-11 w-full justify-start px-3 py-2 text-left font-normal",
                                )}
                              >
                                <span className="text-muted-foreground">{mt.navn} · </span>
                                <span>Tom — åpne kjøkken</span>
                              </Link>
                            </li>
                          )
                        }
                        const ariaEdit = `Rediger ${meal.oppskriftNavn} porsjoner (${meal.mealType})`
                        return (
                          <li key={mt.id}>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-auto min-h-11 w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-normal"
                              aria-label={ariaEdit}
                              onClick={() => setEditingMeal(meal)}
                            >
                              <span className="text-xs text-muted-foreground">{meal.mealType}</span>
                              <span className="font-medium text-foreground">{meal.oppskriftNavn}</span>
                              <span className="text-xs text-muted-foreground">{meal.servings} porsjoner</span>
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

        {!mealsQuery.isFetching && mealsQuery.data != null && mealsQuery.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ingen måltider denne uken ennå. Legg til oppskrifter fra{" "}
            <Link className="underline underline-offset-2" to="/app/chef">
              kjøkkenet
            </Link>
            .
          </p>
        ) : null}
      </div>

      <DetailSheet
        open={editingMeal != null}
        onOpenChange={(open) => {
          if (!open) setEditingMeal(null)
        }}
        labelledById={editTitleId}
        title={editingMeal ? editingMeal.oppskriftNavn : "Rediger måltid"}
        description={
          editingMeal
            ? `${weekdayShortNb(editingMeal.day)} · ${editingMeal.mealType}`
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
                    Tilbake
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={deletePlannedMealMutation.isPending}
                    onClick={() => void confirmRemovePlannedMeal()}
                  >
                    {deletePlannedMealMutation.isPending ? "Fjerner…" : "Bekreft fjerning"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingMeal(null)}>
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    form={EDIT_FORM_ID}
                    className="flex-1"
                    disabled={updateServingsMutation.isPending}
                  >
                    Lagre
                  </Button>
                </>
              )}
            </div>
          ) : null
        }
      >
        {editingMeal && sheetStep === "edit" ? (
          <>
            <form id={EDIT_FORM_ID} className="space-y-4" onSubmit={(e) => void submitServingsEdit(e)}>
              <div>
                <Label htmlFor="plan-edit-servings-display">Porsjoner</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="Trekk fra én porsjon"
                    disabled={editServingsValue <= 1 || updateServingsMutation.isPending}
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
                    aria-label="Legg til én porsjon"
                    disabled={editServingsValue >= 20 || updateServingsMutation.isPending}
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
                Lagre porsjoner
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Ingredienser</h3>
                <span className="text-xs text-muted-foreground">Stryk eller bruk knappen</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Marker det du allerede har hjemme — kun for dette måltidet i planen.
              </p>
              <div className="mt-3 space-y-0">
                {ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen ingrediensrader på oppskriften.</p>
                ) : (
                  ingredients.map((ing) => {
                    const pending = ingredientRowPending(ing)
                    const actionLabel = ing.excluded ? "Ta med" : "Har allerede"
                    const fallbackAria = ing.excluded
                      ? `Ta med ${ing.varetype} i planen igjen`
                      : `Marker ${ing.varetype} som du har allerede`

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
                          <span className="break-words text-sm font-medium leading-snug text-foreground">
                            {formatIngredientLine(ing)}
                          </span>
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {ing.valgfritt ? (
                              <span className="rounded-md border border-border px-1.5 py-0.5">Valgfritt</span>
                            ) : null}
                            {ing.type === "tilbehor" ? (
                              <span className="rounded-md border border-border px-1.5 py-0.5">Tilbehør</span>
                            ) : null}
                            {ing.excluded ? (
                              <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-medium text-foreground">
                                Har allerede hjemme
                              </span>
                            ) : (
                              <span className="rounded-md border border-transparent px-1.5 py-0.5">
                                Inkludert i plan
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
                Fjern måltid fra denne uken
              </Button>
            </div>
          </>
        ) : null}

        {editingMeal && sheetStep === "confirmRemove" ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Er du sikker på at du vil fjerne{" "}
              <span className="font-semibold">{editingMeal.oppskriftNavn}</span> fra{" "}
              <span className="font-medium">{formatWeekRangeTitleNb(editingMeal.weekStartDate)}</span>? Dette påvirker
              alle i husholdningen.
            </p>
            <p className="text-xs text-muted-foreground">
              Hvis handlelisten viser at måltidet allerede er handlet, kan det ikke fjernes her — kokkeloggen må beholdes.
            </p>
            {deleteProtectedReason ? (
              <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                {deleteProtectedReason}
              </p>
            ) : null}
          </div>
        ) : null}
      </DetailSheet>
    </section>
  )
}
