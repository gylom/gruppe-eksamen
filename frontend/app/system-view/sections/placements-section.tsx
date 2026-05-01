import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import { useSvAddPlacement, useSvDeletePlacement } from "../mutations"
import { useSvHousehold } from "../queries"
import { SectionCard } from "../section-card"

export function PlacementsSection() {
  const householdQuery = useSvHousehold()
  const addMutation = useSvAddPlacement()
  const deleteMutation = useSvDeletePlacement()

  const [name, setName] = useState("")
  const placements = householdQuery.data?.plasseringer ?? []

  function handleAdd() {
    if (!name.trim()) {
      toast.error("Enter a placement name.")
      return
    }
    addMutation.mutate(
      { plassering: name.trim() },
      {
        onSuccess: () => {
          setName("")
          toast.success("Placement created.")
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create placement."),
      }
    )
  }

  function handleDelete(id: number) {
    if (!window.confirm("Delete this placement?")) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Placement deleted."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete placement."),
    })
  }

  return (
    <SectionCard
      title="3. Placements"
      description="Track where items live: fridge, freezer, pantry and more."
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="sv-placement-name">New placement</Label>
          <Input
            id="sv-placement-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fridge, freezer, pantry..."
          />
        </div>
        <Button type="button" onClick={handleAdd} disabled={addMutation.isPending}>
          Add placement
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {placements.map((p) => (
          <article
            key={p.id}
            className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-3"
          >
            <div>
              <h3 className="font-medium">{p.plassering}</h3>
              <p className="text-xs text-muted-foreground">ID: {p.id}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-fit"
              onClick={() => handleDelete(p.id)}
            >
              Delete
            </Button>
          </article>
        ))}
        {placements.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">No placements.</p>
        ) : null}
      </div>
    </SectionCard>
  )
}
