import {
  useSvInventory,
  useSvProducts,
  useSvRecommendedRecipes,
  useSvShoppingList,
} from "./queries"

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="rounded-2xl border border-border bg-muted/30 p-4">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <strong className="mt-1 block font-heading text-2xl font-medium text-foreground">
        {value}
      </strong>
    </article>
  )
}

export function StatsStrip() {
  const products = useSvProducts()
  const inventory = useSvInventory()
  const shopping = useSvShoppingList()
  const recommended = useSvRecommendedRecipes()

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Products" value={products.data?.length ?? 0} />
      <StatCard label="Inventory" value={inventory.data?.length ?? 0} />
      <StatCard label="Shopping list" value={shopping.data?.varer.length ?? 0} />
      <StatCard label="Recommended recipes" value={recommended.data?.length ?? 0} />
    </section>
  )
}
