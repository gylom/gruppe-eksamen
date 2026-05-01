import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
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

import { useSvTakeFromInventory } from "../mutations"
import { useSvInventory } from "../queries"
import { SectionCard } from "../section-card"

export function InventoryOverviewSection() {
  const inventoryQuery = useSvInventory()
  const takeOutMutation = useSvTakeFromInventory()

  const [takeOutTarget, setTakeOutTarget] = useState<{ id: number } | null>(null)
  const [takeOutQty, setTakeOutQty] = useState("1")

  const rows = inventoryQuery.data ?? []

  function openTakeOut(id: number) {
    setTakeOutTarget({ id })
    setTakeOutQty("1")
  }

  function confirmTakeOut() {
    if (!takeOutTarget) return
    const qty = Number(takeOutQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Quantity must be greater than 0.")
      return
    }
    takeOutMutation.mutate(
      { id: takeOutTarget.id, kvantitet: qty },
      {
        onSuccess: () => {
          setTakeOutTarget(null)
          toast.success("Inventory updated.")
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Could not take out."),
      }
    )
  }

  return (
    <SectionCard
      title="5. Inventory overview"
      description="See total quantity, minimum, emergency and placements for every item."
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Product type</TableHead>
              <TableHead>Total qty</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Emergency</TableHead>
              <TableHead>Placements</TableHead>
              <TableHead>Take out</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.varetype_id}-${index}`}>
                <TableCell>{row.varenavn}</TableCell>
                <TableCell>{row.varetype}</TableCell>
                <TableCell>
                  {row.total_kvantitet ?? 0} {row.maaleenhet ?? ""}
                </TableCell>
                <TableCell>{row.minimumslager ?? 0}</TableCell>
                <TableCell>{row.beredskapslager ? "Yes" : "No"}</TableCell>
                <TableCell>
                  {row.plasseringer && row.plasseringer.length > 0
                    ? row.plasseringer.join(", ")
                    : "-"}
                </TableCell>
                <TableCell>
                  {row.varer && row.varer.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {row.varer.map((item) => (
                        <Button
                          key={item.id}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openTakeOut(item.id)}
                        >
                          Take from id {item.id}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No inventory.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={takeOutTarget != null}
        onOpenChange={(open) => {
          if (!open) setTakeOutTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take out from inventory</AlertDialogTitle>
            <AlertDialogDescription>
              How much do you want to take out from item id {takeOutTarget?.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="sv-takeout-qty">Quantity</Label>
            <Input
              id="sv-takeout-qty"
              autoFocus
              value={takeOutQty}
              onChange={(e) => setTakeOutQty(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTakeOut} disabled={takeOutMutation.isPending}>
              Take out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  )
}
