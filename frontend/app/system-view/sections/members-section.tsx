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
  useSvAddMember,
  useSvLeaveHousehold,
  useSvRemoveMember,
} from "../mutations"
import { useSvHousehold } from "../queries"
import { SectionCard, selectClass } from "../section-card"

export function MembersSection() {
  const householdQuery = useSvHousehold()
  const addMutation = useSvAddMember()
  const removeMutation = useSvRemoveMember()
  const leaveMutation = useSvLeaveHousehold()

  const [identifier, setIdentifier] = useState("")
  const [role, setRole] = useState("medlem")

  const members = householdQuery.data?.medlemmer ?? []
  const hasHousehold = householdQuery.data?.household != null

  function handleAdd() {
    if (!identifier.trim()) {
      toast.error("Enter a username or email.")
      return
    }
    addMutation.mutate(
      { brukernavnEllerEmail: identifier.trim(), rolle: role },
      {
        onSuccess: () => {
          setIdentifier("")
          setRole("medlem")
          toast.success("Member added.")
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not add member."),
      }
    )
  }

  function handleRemove(userId: number) {
    if (!window.confirm("Remove this member?")) return
    removeMutation.mutate(userId, {
      onSuccess: () => toast.success("Member removed."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not remove member."),
    })
  }

  function handleLeave() {
    if (!window.confirm("Leave the household?")) return
    leaveMutation.mutate({} as never, {
      onSuccess: () => toast.success("You have left the household."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not leave household."),
    })
  }

  return (
    <SectionCard
      title="2. Members"
      description="Invite members and update roles in the household."
    >
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="sv-member-identifier">Username or email</Label>
          <Input
            id="sv-member-identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sv-member-role">Role</Label>
          <select
            id="sv-member-role"
            className={selectClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="medlem">member</option>
            <option value="eier">owner</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleAdd} disabled={addMutation.isPending}>
            Add member
          </Button>
          {hasHousehold ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
            >
              Leave household
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.userId}>
                <TableCell>{m.brukernavn}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.rolle}</TableCell>
                <TableCell>
                  {!m.erMeg ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(m.userId)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No members.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  )
}
