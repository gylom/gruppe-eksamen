import { forwardRef, type ComponentProps } from "react"
import { ImageOff } from "lucide-react"

import { cn } from "~/lib/utils"

import type { RecipeDto } from "./types"

type RecipeCardProps = {
  recipe: RecipeDto
  className?: string
} & Omit<ComponentProps<"button">, "type">

export const RecipeCard = forwardRef<HTMLButtonElement, RecipeCardProps>(function RecipeCard(
  { recipe, className, ...props },
  ref,
) {
  const label = `${recipe.navn}${recipe.kategori ? `, ${recipe.kategori}` : ""}`
  const showImg = typeof recipe.bilde === "string" && recipe.bilde.length > 0

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-none ring-ring transition-[box-shadow,border-color] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
        className,
      )}
      aria-label={`Vis detaljer: ${label}`}
      {...props}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {showImg ? (
          <img
            src={recipe.bilde!}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground" aria-hidden>
            <ImageOff className="size-8 opacity-60" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-heading line-clamp-2 text-sm font-semibold text-foreground">{recipe.navn}</p>
        <p className="text-xs text-muted-foreground">
          {recipe.kategori ?? "Uten kategori"}
          <span aria-hidden> · </span>
          <span>{recipe.porsjoner} porsj.</span>
        </p>
      </div>
    </button>
  )
})
