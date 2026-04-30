import { useEffect, useState } from "react"

import type { UseMutationResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import type { RecipeCategoryDto } from "~/features/recipes/types"
import {
  addWeeksToMondayKey,
  defaultDayNumberForWeek,
  expandWeekFromMonday,
  getMondayKeyContaining,
  weekdayShort,
} from "~/lib/dates"
import { getDateLocaleTag } from "~/lib/i18n"

import type { CreatePlannedMealBody, PlannedMealDto } from "./types"

import { sortPlanningCategories } from "./constants"

function clampServings(n: number): number {
  return Math.min(20, Math.max(1, Math.round(n)))
}

function pickDefaultMealTypeId(categories: RecipeCategoryDto[]): number {
  const ids = new Set(categories.map((c) => c.id))
  if (ids.has(3)) return 3
  return categories[0]?.id ?? 3
}

export type AddToPlanPanelProps = {
  formId: string
  recipeId: number
  recipePortions: number
  householdMemberCount: number | null
  mealCategories: RecipeCategoryDto[]
  createMutation: UseMutationResult<
    PlannedMealDto,
    Error,
    CreatePlannedMealBody
  >
  onSaved: () => void
}

export function AddToPlanPanel({
  formId,
  recipeId,
  recipePortions,
  householdMemberCount,
  mealCategories,
  createMutation,
  onSaved,
}: AddToPlanPanelProps) {
  const { t, i18n } = useTranslation()
  const dateLoc = getDateLocaleTag(i18n.language)
  const [weekOffset, setWeekOffset] = useState(0)
  const [day, setDay] = useState(() =>
    defaultDayNumberForWeek(getMondayKeyContaining())
  )
  const [mealTypeId, setMealTypeId] = useState(() =>
    pickDefaultMealTypeId(mealCategories)
  )
  const [servings, setServings] = useState(() =>
    clampServings(householdMemberCount ?? recipePortions ?? 4)
  )
  const [servingsTouched, setServingsTouched] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const sortedCategories = sortPlanningCategories(mealCategories)
  const selectedMondayKey = addWeeksToMondayKey(
    getMondayKeyContaining(),
    weekOffset
  )
  const weekDays = expandWeekFromMonday(selectedMondayKey)

  useEffect(() => {
    const wm = addWeeksToMondayKey(getMondayKeyContaining(), weekOffset)
    setDay(defaultDayNumberForWeek(wm))
  }, [weekOffset])

  useEffect(() => {
    if (sortedCategories.length === 0) return
    setMealTypeId((prev) =>
      sortedCategories.some((c) => c.id === prev)
        ? prev
        : pickDefaultMealTypeId(sortedCategories)
    )
  }, [sortedCategories])

  useEffect(() => {
    if (servingsTouched) return
    setServings(clampServings(householdMemberCount ?? recipePortions ?? 4))
  }, [householdMemberCount, recipePortions, servingsTouched])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    try {
      await createMutation.mutateAsync({
        oppskriftId: recipeId,
        weekStartDate: selectedMondayKey,
        day,
        mealTypeId,
        servings,
      })
      onSaved()
    } catch {
      setLocalError(t("plan.addToPlanSaveFailed"))
    }
  }

  function bumpServings(delta: number) {
    setServingsTouched(true)
    setServings((s) => clampServings(s + delta))
  }

  return (
    <form
      id={formId}
      className="space-y-5"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div>
        <p className="text-sm font-medium text-foreground">
          {t("plan.addToPlanWeekLabel")}
        </p>
        <div
          className="mt-2 flex gap-2"
          role="group"
          aria-label={t("plan.addToPlanChooseWeek")}
        >
          <Button
            type="button"
            size="sm"
            variant={weekOffset === 0 ? "default" : "outline"}
            aria-pressed={weekOffset === 0}
            onClick={() => setWeekOffset(0)}
          >
            {t("plan.addToPlanThisWeek")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={weekOffset === 1 ? "default" : "outline"}
            aria-pressed={weekOffset === 1}
            onClick={() => setWeekOffset(1)}
          >
            {t("plan.addToPlanNextWeek")}
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-foreground">{t("plan.addToPlanDayLabel")}</Label>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const selected = day === d.dayNumber
            const short = weekdayShort(d.dayNumber, dateLoc)
            const dom = Number(d.dateKey.slice(8, 10))
            return (
              <Button
                key={d.dateKey}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                className="h-auto min-h-[2.75rem] flex-col px-1 py-1 text-[10px] leading-tight sm:text-xs"
                aria-pressed={selected}
                aria-label={`${short} ${dom}`}
                onClick={() => setDay(d.dayNumber)}
              >
                <span>{short}</span>
                <span className="text-[10px] opacity-90">{dom}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <Label className="text-foreground">
          {t("plan.addToPlanMealTypeLabel")}
        </Label>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="group"
          aria-label={t("plan.addToPlanChooseMealType")}
        >
          {sortedCategories.map((c) => {
            const selected = mealTypeId === c.id
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                onClick={() => setMealTypeId(c.id)}
              >
                {c.navn}
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <Label htmlFor={`${formId}-servings`}>{t("plan.servingsLabel")}</Label>
        <div className="mt-2 flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={t("plan.decreaseServing")}
            disabled={servings <= 1 || createMutation.isPending}
            onClick={() => bumpServings(-1)}
          >
            −
          </Button>
          <span
            id={`${formId}-servings`}
            className="min-w-[2rem] text-center font-medium tabular-nums"
            aria-live="polite"
          >
            {servings}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={t("plan.increaseServing")}
            disabled={servings >= 20 || createMutation.isPending}
            onClick={() => bumpServings(1)}
          >
            +
          </Button>
        </div>
      </div>

      {localError ? (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      ) : null}

      <button type="submit" className="sr-only" tabIndex={-1}>
        {t("common.saveToPlan")}
      </button>
    </form>
  )
}
