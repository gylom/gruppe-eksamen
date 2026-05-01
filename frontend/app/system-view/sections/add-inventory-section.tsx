import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import { useSvAddInventoryItem } from "../mutations"
import { useSvHousehold, useSvProducts, useSvUnits } from "../queries"
import { SectionCard, selectClass } from "../section-card"

const EMPTY_FORM = {
  productId: "",
  quantity: "1",
  measurementUnitId: "",
  purchaseDate: "",
  bestBeforeDate: "",
  placementId: "",
}

export function AddInventorySection() {
  const productsQuery = useSvProducts()
  const unitsQuery = useSvUnits()
  const householdQuery = useSvHousehold()
  const addMutation = useSvAddInventoryItem()

  const [form, setForm] = useState(EMPTY_FORM)

  const products = productsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const placements = householdQuery.data?.plasseringer ?? []

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    if (!form.productId) {
      toast.error("Select a product first.")
      return
    }
    addMutation.mutate(
      {
        vareId: Number(form.productId),
        kvantitet: Number(form.quantity) || 0,
        maaleenhetId: form.measurementUnitId ? Number(form.measurementUnitId) : null,
        kjopsdato: form.purchaseDate ? `${form.purchaseDate}T00:00:00` : null,
        bestfordato: form.bestBeforeDate || null,
        plasseringId: form.placementId ? Number(form.placementId) : null,
      },
      {
        onSuccess: () => {
          setForm({
            ...EMPTY_FORM,
            placementId: placements[0]?.id ? String(placements[0].id) : "",
          })
          toast.success("Item added to inventory.")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not add item."),
      }
    )
  }

  return (
    <SectionCard
      title="6. Add item to inventory"
      description="Register new items with quantity, dates and placement."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="sv-add-product">Product</Label>
          <select
            id="sv-add-product"
            className={selectClass}
            value={form.productId}
            onChange={(e) => update("productId", e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.varenavn} ({p.id})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-add-qty">Quantity</Label>
          <Input
            id="sv-add-qty"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-add-unit">Unit</Label>
          <select
            id="sv-add-unit"
            className={selectClass}
            value={form.measurementUnitId}
            onChange={(e) => update("measurementUnitId", e.target.value)}
          >
            <option value="">Use selected / default</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.enhet}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-add-purchase">Purchase date</Label>
          <Input
            id="sv-add-purchase"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => update("purchaseDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-add-bestbefore">Best before</Label>
          <Input
            id="sv-add-bestbefore"
            type="date"
            value={form.bestBeforeDate}
            onChange={(e) => update("bestBeforeDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-add-placement">Placement</Label>
          <select
            id="sv-add-placement"
            className={selectClass}
            value={form.placementId}
            onChange={(e) => update("placementId", e.target.value)}
          >
            <option value="">Select placement</option>
            {placements.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plassering}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="button" onClick={handleSubmit} disabled={addMutation.isPending}>
        Add to inventory
      </Button>
    </SectionCard>
  )
}
