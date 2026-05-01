import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import { useSvCreateHousehold, useSvRenameHousehold } from "../mutations"
import { useSvHousehold } from "../queries"
import { SectionCard } from "../section-card"

export function HouseholdSection() {
  const householdQuery = useSvHousehold()
  const createMutation = useSvCreateHousehold()
  const renameMutation = useSvRenameHousehold()

  const [name, setName] = useState("")

  useEffect(() => {
    if (householdQuery.data?.household?.navn != null) {
      setName(householdQuery.data.household.navn)
    }
  }, [householdQuery.data?.household?.navn])

  const household = householdQuery.data?.household

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Enter a household name.")
      return
    }
    createMutation.mutate(
      { navn: name.trim() },
      {
        onSuccess: () => toast.success("Household created."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create household."),
      }
    )
  }

  function handleRename() {
    if (!name.trim()) {
      toast.error("Enter a household name.")
      return
    }
    renameMutation.mutate(
      { navn: name.trim() },
      {
        onSuccess: () => toast.success("Household updated."),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update household."),
      }
    )
  }

  const busy = createMutation.isPending || renameMutation.isPending

  return (
    <SectionCard
      title="1. Household"
      description="Manage name, active household and your role."
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="sv-household-name">Household name</Label>
          <Input
            id="sv-household-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCreate} disabled={busy}>
            Create household
          </Button>
          <Button type="button" variant="outline" onClick={handleRename} disabled={busy}>
            Update name
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
        <p>
          <strong className="font-medium">Active household:</strong> {household?.navn ?? "-"}
        </p>
        <p>
          <strong className="font-medium">My role:</strong> {household?.minRolle ?? "-"}
        </p>
      </div>
    </SectionCard>
  )
}
