import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import { useSvSaveInventorySettings } from "../mutations"
import { useSvProductTypes } from "../queries"
import { SectionCard, selectClass } from "../section-card"

export function StockSettingsSection() {
  const productTypesQuery = useSvProductTypes()
  const saveMutation = useSvSaveInventorySettings()

  const [productTypeId, setProductTypeId] = useState("")
  const [minStock, setMinStock] = useState("0")
  const [emergency, setEmergency] = useState(false)

  const productTypes = productTypesQuery.data ?? []

  function handleSave() {
    if (!productTypeId) {
      toast.error("Select a product type first.")
      return
    }
    saveMutation.mutate(
      {
        varetypeId: Number(productTypeId),
        minimumslager: Number(minStock) || 0,
        beredskapslager: emergency,
      },
      {
        onSuccess: () => toast.success("Stock settings saved."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not save settings."),
      }
    )
  }

  return (
    <SectionCard
      title="4. Minimum and emergency stock"
      description="Define what should be at home and what counts toward emergency stock."
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="sv-stock-type">Product type</Label>
          <select
            id="sv-stock-type"
            className={selectClass}
            value={productTypeId}
            onChange={(e) => setProductTypeId(e.target.value)}
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
          <Label htmlFor="sv-stock-min">Minimum stock</Label>
          <Input
            id="sv-stock-min"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox
            id="sv-stock-emergency"
            checked={emergency}
            onCheckedChange={(v) => setEmergency(v === true)}
          />
          <Label htmlFor="sv-stock-emergency">Part of emergency stock</Label>
        </div>
      </div>

      <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
        Save settings
      </Button>
    </SectionCard>
  )
}
