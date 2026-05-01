import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Checkbox } from "~/components/ui/checkbox"

import type { RecipeDto, RecipeIngredientDto } from "./types"

function ingredientLabel(i: RecipeIngredientDto): string {
  return i.varetype
}

export function RecipeDetailPanel({ recipe }: { recipe: RecipeDto }) {
  const { t } = useTranslation()
  const [includedIds, setIncludedIds] = useState<Set<number>>(
    () => new Set(recipe.ingredienser.map((i) => i.id))
  )

  useEffect(() => {
    setIncludedIds(new Set(recipe.ingredienser.map((i) => i.id)))
  }, [recipe.id, recipe.ingredienser])

  function toggle(id: number, next: boolean) {
    setIncludedIds((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(id)
      else copy.delete(id)
      return copy
    })
  }

  return (
    <div className="space-y-6">
      {recipe.bilde ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <img
            src={recipe.bilde}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      {recipe.ingredienser.length > 0 ? (
        <section aria-labelledby="chef-detail-ingredients-heading">
          <h3
            id="chef-detail-ingredients-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t("recipeDetail.ingredientsTitle")}
          </h3>
          <ul className="mt-2 space-y-2">
            {recipe.ingredienser.map((i, idx) => {
              const inputId = `chef-ingredient-${recipe.id}-${idx}`
              const included = includedIds.has(i.id)
              const label = ingredientLabel(i)
              return (
                <li key={i.id}>
                  <label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      id={inputId}
                      className="shrink-0"
                      checked={included}
                      onCheckedChange={(next) => toggle(i.id, next === true)}
                      aria-label={
                        included
                          ? t("recipeDetail.ariaExclude", { item: label })
                          : t("recipeDetail.ariaInclude", { item: label })
                      }
                    />
                    <span className="text-sm leading-snug font-medium text-foreground">
                      {label}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
