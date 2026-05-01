import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import {
  useSvCreateRecipe,
  useSvDeleteRecipe,
  useSvSaveRecipePreference,
} from "../mutations"
import {
  useSvHiddenRecipes,
  useSvProductTypes,
  useSvRecipeCategories,
  useSvRecipes,
  useSvRecommendedRecipes,
  useSvUnits,
} from "../queries"
import type { RecipeIngredientFormRow } from "../types"
import type { RecipeDto } from "~/features/recipes/types"
import { SectionCard, selectClass } from "../section-card"

const EMPTY_INGREDIENT: RecipeIngredientFormRow = {
  productTypeId: "",
  quantity: "1",
  measurementUnitId: "",
  type: "ingredient",
  optional: false,
}

const EMPTY_FORM = {
  name: "",
  categoryId: "",
  instructions: "",
  servings: "1",
  imageUrl: "",
  ingredients: [EMPTY_INGREDIENT],
}

interface RecipeRowProps {
  recipe: Pick<RecipeDto, "id" | "navn" | "karakter">
  hidden?: boolean
}

function RecipeRow({ recipe, hidden = false }: RecipeRowProps) {
  const savePref = useSvSaveRecipePreference()
  const deleteRecipe = useSvDeleteRecipe()

  function rate(score: number) {
    savePref.mutate(
      { recipeId: recipe.id, data: { karakter: score } },
      {
        onSuccess: () =>
          toast.success(score === 1 ? "Recipe hidden." : "Rating saved."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not save rating."),
      }
    )
  }

  function hide() {
    savePref.mutate(
      { recipeId: recipe.id, data: { skjul: true } },
      {
        onSuccess: () => toast.success("Recipe hidden."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not hide recipe."),
      }
    )
  }

  function unhide() {
    savePref.mutate(
      { recipeId: recipe.id, data: { skjul: false, karakter: 5 } },
      {
        onSuccess: () => toast.success("Recipe shown again."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not unhide recipe."),
      }
    )
  }

  function remove() {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => toast.success("Recipe deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not delete recipe."),
    })
  }

  return (
    <article className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium">{recipe.navn}</h4>
        <span className="text-xs text-muted-foreground">id {recipe.id}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Rating: {recipe.karakter ?? "Not rated"}/10
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <Button
            key={score}
            type="button"
            size="sm"
            variant={recipe.karakter === score ? "default" : "outline"}
            onClick={() => rate(score)}
            disabled={savePref.isPending}
            title={score === 1 ? "1 hides the recipe" : `Rate ${score}`}
          >
            {score}
          </Button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {hidden ? (
          <Button type="button" size="sm" variant="outline" onClick={unhide}>
            Show again
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={hide}>
            Hide
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={remove}
          disabled={deleteRecipe.isPending}
        >
          Delete
        </Button>
      </div>
    </article>
  )
}

export function RecipesSection() {
  const productTypesQuery = useSvProductTypes()
  const unitsQuery = useSvUnits()
  const categoriesQuery = useSvRecipeCategories()
  const recipesQuery = useSvRecipes()
  const recommendedQuery = useSvRecommendedRecipes()
  const hiddenQuery = useSvHiddenRecipes()
  const createMutation = useSvCreateRecipe()

  const [form, setForm] = useState(EMPTY_FORM)

  const productTypes = productTypesQuery.data ?? []
  const units = unitsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const recipes = recipesQuery.data ?? []
  const recommended = recommendedQuery.data ?? []
  const hidden = hiddenQuery.data ?? []

  function updateField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value as never }))
  }

  function updateIngredient(
    index: number,
    patch: Partial<RecipeIngredientFormRow>
  ) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }))
  }

  function addIngredientRow() {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ...EMPTY_INGREDIENT }],
    }))
  }

  function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Enter a recipe name.")
      return
    }
    createMutation.mutate(
      {
        navn: form.name.trim(),
        instruksjoner: form.instructions,
        porsjoner: Number(form.servings) || 1,
        kategoriId: form.categoryId ? Number(form.categoryId) : null,
        bilde: form.imageUrl || null,
        ingredienser: form.ingredients
          .filter((row) => row.productTypeId)
          .map((row) => ({
            varetypeId: Number(row.productTypeId),
            kvantitet: Number(row.quantity) || 0,
            maaleenhetId: row.measurementUnitId ? Number(row.measurementUnitId) : null,
            type: row.type || "ingredient",
            valgfritt: row.optional,
          })),
      },
      {
        onSuccess: () => {
          setForm({ ...EMPTY_FORM, ingredients: [{ ...EMPTY_INGREDIENT }] })
          toast.success("Recipe created.")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not create recipe."),
      }
    )
  }

  return (
    <SectionCard
      title="9. Recipes"
      description="Create recipes with ingredients, servings and instructions."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sv-recipe-name">Name</Label>
          <Input
            id="sv-recipe-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sv-recipe-servings">Servings</Label>
          <Input
            id="sv-recipe-servings"
            value={form.servings}
            onChange={(e) => updateField("servings", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sv-recipe-category">Category</Label>
          <select
            id="sv-recipe-category"
            className={selectClass}
            value={form.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.navn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sv-recipe-image">Image URL</Label>
        <Input
          id="sv-recipe-image"
          value={form.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sv-recipe-instructions">Instructions</Label>
        <textarea
          id="sv-recipe-instructions"
          rows={5}
          className="min-h-24 w-full resize-y rounded-md border border-input bg-input/30 p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          value={form.instructions}
          onChange={(e) => updateField("instructions", e.target.value)}
        />
      </div>

      <div>
        <h3 className="mb-2 font-heading text-base font-medium">Ingredients</h3>
        <div className="space-y-2">
          {form.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-border bg-muted/10 p-3 sm:grid-cols-5 sm:items-end"
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`sv-ing-type-${index}`}>Product type</Label>
                <select
                  id={`sv-ing-type-${index}`}
                  className={selectClass}
                  value={ingredient.productTypeId}
                  onChange={(e) =>
                    updateIngredient(index, { productTypeId: e.target.value })
                  }
                >
                  <option value="">Select product type</option>
                  {productTypes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.varetype}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`sv-ing-qty-${index}`}>Quantity</Label>
                <Input
                  id={`sv-ing-qty-${index}`}
                  value={ingredient.quantity}
                  onChange={(e) =>
                    updateIngredient(index, { quantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`sv-ing-unit-${index}`}>Unit</Label>
                <select
                  id={`sv-ing-unit-${index}`}
                  className={selectClass}
                  value={ingredient.measurementUnitId}
                  onChange={(e) =>
                    updateIngredient(index, { measurementUnitId: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.enhet}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id={`sv-ing-opt-${index}`}
                  checked={ingredient.optional}
                  onCheckedChange={(v) =>
                    updateIngredient(index, { optional: v === true })
                  }
                />
                <Label htmlFor={`sv-ing-opt-${index}`}>Optional</Label>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-2" onClick={addIngredientRow}>
          Add ingredient
        </Button>
      </div>

      <Button type="button" onClick={handleCreate} disabled={createMutation.isPending}>
        Create recipe
      </Button>

      <div>
        <h3 className="mt-2 mb-2 font-heading text-base font-medium">Existing recipes</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeRow key={r.id} recipe={r} />
          ))}
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipes.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mt-2 mb-2 font-heading text-base font-medium">Recommended recipes</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-muted/20 p-3"
            >
              <h4 className="font-medium">{r.navn}</h4>
              <p className="text-sm">Match: {Math.round(r.matchProsent)}%</p>
              <p className="text-sm text-muted-foreground">
                Rating: {r.karakter ?? "Not rated"}/10
              </p>
            </article>
          ))}
          {recommended.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommended recipes.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mt-2 mb-2 font-heading text-base font-medium">Hidden recipes</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hidden.map((r) => (
            <RecipeRow key={r.id} recipe={r} hidden />
          ))}
          {hidden.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hidden recipes.</p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  )
}
