import { useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"

import { DetailSheet } from "~/components/detail-sheet"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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

export default function ChefRoute() {
  const searchInputId = "chef-recipe-search"
  const detailTitleId = "chef-recipe-detail-title"

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const trimmed = debouncedSearch.trim()
  const [kategoriId, setKategoriId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetTitle, setSheetTitle] = useState("")

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

  function addToPlanHint() {
    toast.info("Ukeplanlegging kommer i neste leveranse (Story 2.2).")
  }

  return (
    <section className="p-4" aria-labelledby="chef-heading">
      <div className="space-y-1">
        <h1 id="chef-heading" className="font-heading text-xl font-semibold tracking-tight">
          Kjøkken
        </h1>
        <p className="text-sm text-muted-foreground">Finn oppskrifter og åpne detaljer her.</p>
      </div>

      <div className="mt-6 space-y-3">
        <Label htmlFor={searchInputId} className="text-foreground">
          Søk i oppskrifter
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
            placeholder="Søk på navn eller ingrediens"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Måltidstype</p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer etter måltidstype"
        >
          <Button
            type="button"
            size="sm"
            variant={kategoriId == null ? "default" : "outline"}
            aria-pressed={kategoriId == null}
            onClick={() => setKategoriId(null)}
          >
            Alle
          </Button>
          {categoriesQuery.isLoading ? (
            <span className="text-xs text-muted-foreground">Laster filtre…</span>
          ) : null}
          {filterCategories.map((c) => {
            const selected = kategoriId === c.id
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                aria-label={`Måltidstype ${c.navn}${selected ? ", valgt" : ""}`}
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
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-foreground">Kunne ikke laste oppskrifter.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recipesQuery.error instanceof Error ? recipesQuery.error.message : "Ukjent feil"}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => void recipesQuery.refetch()}
            >
              Prøv igjen
            </Button>
          </div>
        ) : null}

        {recipesQuery.isFetching && recipesQuery.data == null ? (
          <ul className="space-y-3" aria-label="Laster oppskriftsliste">
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
            <p className="text-sm font-medium text-foreground">Ingen treff</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Prøv å fjerne søk eller måltidsfilter, eller søk på noe annet."
                : "Det finnes ingen oppskrifter å vise ennå."}
            </p>
            {hasActiveFilters ? (
              <Button type="button" className="mt-4" variant="secondary" onClick={clearFilters}>
                Nullstill søk og filter
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
          if (!open) setSelectedId(null)
        }}
        labelledById={detailTitleId}
        title={detailTitle}
        description={detailDescription}
        returnFocusRef={returnFocusRef}
        footer={
          <Button type="button" className="w-full" size="lg" onClick={addToPlanHint}>
            Legg i plan
          </Button>
        }
      >
        {detailQuery.isLoading ? (
          <div className="space-y-4 py-2" aria-busy aria-label="Laster oppskriftsdetaljer">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        ) : null}
        {detailQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">Kunne ikke hente detaljer.</p>
            <Button type="button" size="sm" className="mt-3" onClick={() => void detailQuery.refetch()}>
              Prøv igjen
            </Button>
          </div>
        ) : null}
        {detailQuery.data != null ? <RecipeDetailPanel recipe={detailQuery.data} /> : null}
      </DetailSheet>
    </section>
  )
}
