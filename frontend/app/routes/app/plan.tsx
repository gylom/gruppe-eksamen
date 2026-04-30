import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { Button, buttonVariants } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import {
  PLANNING_MEAL_FALLBACK_NAVN,
  PLANNING_MEAL_TYPE_IDS,
  PLANNING_MEAL_TYPE_ORDER,
  sortPlanningCategories,
} from "~/features/planning/constants"
import type { PlannedMealDto } from "~/features/planning/types"
import {
  usePlannedMeals,
  useUpdatePlannedMealServings,
} from "~/features/planning/use-planned-meals"
import { useRecipeCategories } from "~/features/recipes/use-recipes"
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

export default function PlanRoute() {
  const [weekMonday, setWeekMonday] = useState(() => getMondayKeyContaining())
  const mealsQuery = usePlannedMeals(weekMonday)
  const categoriesQuery = useRecipeCategories()
  const updateServingsMutation = useUpdatePlannedMealServings()

  const [editingMeal, setEditingMeal] = useState<PlannedMealDto | null>(null)
  const [editServingsValue, setEditServingsValue] = useState(4)
  const [editError, setEditError] = useState<string | null>(null)

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

  useEffect(() => {
    if (editingMeal) setEditServingsValue(editingMeal.servings)
    setEditError(null)
  }, [editingMeal])

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

  const editTitleId = "plan-edit-meal-title"

  return (
    <section className="p-4 pb-28" aria-labelledby="plan-heading">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            </div>
          ) : null
        }
      >
        {editingMeal ? (
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
        ) : null}
      </DetailSheet>
    </section>
  )
}
