import type { RecipeDto, RecipeIngredientDto } from "./types"

function ingredientLine(i: RecipeIngredientDto): string {
  if (i.kvantitet == null) {
    const unitPart = i.maaleenhet ? ` (${i.maaleenhet})` : ""
    return `${i.varetype}${unitPart}\u00a0\u2014 etter smak`
  }
  const qty = `${i.kvantitet}`.replace(".", ",")
  const unit = i.maaleenhet ? `\u00a0${i.maaleenhet}` : ""
  return `${qty}${unit} ${i.varetype}`
}

export function RecipeDetailPanel({ recipe }: { recipe: RecipeDto }) {
  const required = recipe.ingredienser.filter((i) => !(i.valgfritt ?? false))
  const optional = recipe.ingredienser.filter((i) => i.valgfritt ?? false)

  return (
    <div className="space-y-6">
      {recipe.bilde ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <img src={recipe.bilde} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}

      <section aria-labelledby="chef-detail-portions-heading">
        <h3 id="chef-detail-portions-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Porsjoner
        </h3>
        <p className="mt-1 text-sm">{recipe.porsjoner}</p>
      </section>

      {required.length > 0 ? (
        <section aria-labelledby="chef-detail-required-heading">
          <h3 id="chef-detail-required-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ingredienser
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug">
            {required.map((i) => (
              <li key={i.id}>{ingredientLine(i)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {optional.length > 0 ? (
        <section aria-labelledby="chef-detail-optional-heading">
          <h3 id="chef-detail-optional-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Valgfrie ingredienser
          </h3>
          <p id="chef-detail-optional-hint" className="sr-only">
            Liste over valgfrie ingredienser; merket eksplisitt som valgfritt.
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug" aria-describedby="chef-detail-optional-hint">
            {optional.map((i) => (
              <li key={i.id}>
                <span className="font-medium">(Valgfritt)</span> {ingredientLine(i)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recipe.instruksjoner?.trim() ? (
        <section aria-labelledby="chef-detail-steps-heading">
          <h3 id="chef-detail-steps-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fremgangsmåte
          </h3>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {recipe.instruksjoner}
          </div>
        </section>
      ) : null}
    </div>
  )
}
