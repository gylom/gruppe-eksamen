import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

import { useSvCreateConsumption } from "../mutations"
import {
  useSvConsumption,
  useSvInventory,
  useSvProducts,
  useSvUnits,
} from "../queries"
import { SectionCard, selectClass } from "../section-card"

const EMPTY_FORM = {
  varelagerId: "",
  vareId: "",
  kvantitet: "1",
  maaleenhetId: "",
  forbruksdato: "",
}

export function ConsumptionSection() {
  const inventoryQuery = useSvInventory()
  const productsQuery = useSvProducts()
  const unitsQuery = useSvUnits()
  const consumptionQuery = useSvConsumption()
  const createMutation = useSvCreateConsumption()

  const [form, setForm] = useState(EMPTY_FORM)

  const inventory = inventoryQuery.data ?? []
  const products = productsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const consumptionRows = consumptionQuery.data ?? []

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const qty = Number(form.kvantitet)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0.")
      return
    }
    createMutation.mutate(
      {
        varelagerId: form.varelagerId ? Number(form.varelagerId) : null,
        vareId: form.vareId ? Number(form.vareId) : null,
        kvantitet: qty,
        maaleenhetId: form.maaleenhetId ? Number(form.maaleenhetId) : null,
        forbruksdato: form.forbruksdato ? `${form.forbruksdato}T00:00:00` : null,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          toast.success("Consumption registered.")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not register consumption."),
      }
    )
  }

  return (
    <SectionCard
      title="8. Consumption"
      description="Register what was used, refresh inventory and recipe match."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="sv-cons-inv">From inventory row</Label>
          <select
            id="sv-cons-inv"
            className={selectClass}
            value={form.varelagerId}
            onChange={(e) => update("varelagerId", e.target.value)}
          >
            <option value="">Select inventory row</option>
            {inventory.flatMap((row) =>
              (row.varer ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {row.varenavn} (inv id {item.id})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-cons-product">Or product</Label>
          <select
            id="sv-cons-product"
            className={selectClass}
            value={form.vareId}
            onChange={(e) => update("vareId", e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.varenavn}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-cons-qty">Quantity</Label>
          <Input
            id="sv-cons-qty"
            value={form.kvantitet}
            onChange={(e) => update("kvantitet", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-cons-unit">Unit</Label>
          <select
            id="sv-cons-unit"
            className={selectClass}
            value={form.maaleenhetId}
            onChange={(e) => update("maaleenhetId", e.target.value)}
          >
            <option value="">None</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.enhet}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-cons-date">Consumption date</Label>
          <Input
            id="sv-cons-date"
            type="date"
            value={form.forbruksdato}
            onChange={(e) => update("forbruksdato", e.target.value)}
          />
        </div>
      </div>

      <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending}>
        Register consumption
      </Button>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumptionRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.forbruksdato
                    ? new Date(row.forbruksdato).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>{row.varenavn ?? "-"}</TableCell>
                <TableCell>{row.varetype ?? "-"}</TableCell>
                <TableCell>{row.kvantitet ?? "-"}</TableCell>
                <TableCell>{row.maaleenhet ?? "-"}</TableCell>
                <TableCell>{row.brukernavn ?? "-"}</TableCell>
              </TableRow>
            ))}
            {consumptionRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No consumption recorded.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  )
}
