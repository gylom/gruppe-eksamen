import { AddInventorySection } from "./sections/add-inventory-section"
import { ConsumptionSection } from "./sections/consumption-section"
import { HouseholdSection } from "./sections/household-section"
import { InventoryOverviewSection } from "./sections/inventory-overview-section"
import { MembersSection } from "./sections/members-section"
import { PlacementsSection } from "./sections/placements-section"
import { RecipesSection } from "./sections/recipes-section"
import { ShoppingSection } from "./sections/shopping-section"
import { StockSettingsSection } from "./sections/stock-settings-section"
import { StatsStrip } from "./stats-strip"

export default function SystemViewRoute() {
  return (
    <section className="px-4 pb-8" aria-label="System view">
      <header className="py-4">
        <h1 className="font-heading text-2xl font-medium text-foreground">
          System view
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo dashboard exposing every backend endpoint against the SQL schema.
        </p>
      </header>

      <div className="space-y-5">
        <StatsStrip />
        <div className="grid gap-5 lg:grid-cols-2">
          <HouseholdSection />
          <MembersSection />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <PlacementsSection />
          <StockSettingsSection />
        </div>
        <InventoryOverviewSection />
        <AddInventorySection />
        <ShoppingSection />
        <ConsumptionSection />
        <RecipesSection />
      </div>
    </section>
  )
}
