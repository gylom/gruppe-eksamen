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

import {
  useSvAddShoppingItem,
  useSvDeleteShoppingItem,
} from "../mutations"
import {
  useSvProducts,
  useSvProductTypes,
  useSvShoppingList,
  useSvUnits,
} from "../queries"
import type { ShoppingSuggestionDto } from "../types"
import { SectionCard, selectClass } from "../section-card"

const EMPTY_FORM = {
  varetypeId: "",
  vareId: "",
  kvantitet: "1",
  maaleenhetId: "",
}

export function ShoppingSection() {
  const productTypesQuery = useSvProductTypes()
  const productsQuery = useSvProducts()
  const unitsQuery = useSvUnits()
  const shoppingQuery = useSvShoppingList()
  const addMutation = useSvAddShoppingItem()
  const deleteMutation = useSvDeleteShoppingItem()

  const [form, setForm] = useState(EMPTY_FORM)

  const productTypes = productTypesQuery.data ?? []
  const products = productsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const shoppingList = shoppingQuery.data?.varer ?? []
  const suggestions = shoppingQuery.data?.forslag ?? []

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAdd() {
    if (!form.varetypeId) {
      toast.error("Select a product type.")
      return
    }
    addMutation.mutate(
      {
        varetypeId: Number(form.varetypeId),
        vareId: form.vareId ? Number(form.vareId) : null,
        kvantitet: form.kvantitet ? Number(form.kvantitet) : null,
        maaleenhetId: form.maaleenhetId ? Number(form.maaleenhetId) : null,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          toast.success("Added to shopping list.")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not add to shopping list."),
      }
    )
  }

  function handleDelete(id: number) {
    if (!window.confirm("Delete shopping list row?")) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Row deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not delete row."),
    })
  }

  function handleAddSuggestion(suggestion: ShoppingSuggestionDto) {
    addMutation.mutate(
      {
        varetypeId: suggestion.varetypeId,
        vareId: null,
        kvantitet: suggestion.forslagKvantitet,
        maaleenhetId: null,
      },
      {
        onSuccess: () => toast.success("Suggestion added."),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not add suggestion."),
      }
    )
  }

  return (
    <SectionCard
      title="7. Shopping list"
      description="Manage purchases and suggestions based on minimum stock."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="sv-shop-type">Product type</Label>
          <select
            id="sv-shop-type"
            className={selectClass}
            value={form.varetypeId}
            onChange={(e) => update("varetypeId", e.target.value)}
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
          <Label htmlFor="sv-shop-product">Product</Label>
          <select
            id="sv-shop-product"
            className={selectClass}
            value={form.vareId}
            onChange={(e) => update("vareId", e.target.value)}
          >
            <option value="">Optional specific product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.varenavn}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-shop-qty">Quantity</Label>
          <Input
            id="sv-shop-qty"
            value={form.kvantitet}
            onChange={(e) => update("kvantitet", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sv-shop-unit">Unit</Label>
          <select
            id="sv-shop-unit"
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
      </div>

      <Button type="button" onClick={handleAdd} disabled={addMutation.isPending}>
        Add to shopping list
      </Button>

      <div>
        <h3 className="mt-2 mb-2 font-heading text-base font-medium">Shopping list</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shoppingList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.varetype}</TableCell>
                  <TableCell>{item.varenavn ?? "-"}</TableCell>
                  <TableCell>{item.kvantitet ?? "-"}</TableCell>
                  <TableCell>{item.maaleenhet ?? "-"}</TableCell>
                  <TableCell>{item.brukernavn ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {shoppingList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Empty list.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mt-2 mb-2 font-heading text-base font-medium">
          Suggestions from minimum stock
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s, index) => (
            <article
              key={`${s.varetypeId}-${index}`}
              className="rounded-xl border border-border bg-muted/20 p-3"
            >
              <h4 className="font-medium">{s.varetype}</h4>
              <p className="text-sm">Suggested amount: {s.forslagKvantitet}</p>
              <p className="text-sm text-muted-foreground">{s.begrunnelse}</p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={() => handleAddSuggestion(s)}
                disabled={addMutation.isPending}
              >
                Add suggestion
              </Button>
            </article>
          ))}
          {suggestions.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">No suggestions.</p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  )
}
