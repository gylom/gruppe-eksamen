import { Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { useMe } from "~/features/auth/use-me"
import { formatInviteForDisplay } from "~/features/household/invite-input"
import { useGenerateInvite, useHousehold, useRevokeInvite } from "~/features/household/use-household"

function formatExpires(iso: string): string {
  try {
    return new Date(iso).toLocaleString("nb-NO", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export default function AccountRoute() {
  const me = useMe()
  const household = useHousehold()
  const generateInvite = useGenerateInvite()
  const revokeInvite = useRevokeInvite()
  const [revokeOpen, setRevokeOpen] = useState(false)

  const isOwner = me.data?.householdRole === "eier"
  const hName = household.data?.household?.navn ?? me.data?.householdName ?? ""
  const active = household.data?.activeInvite

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Kode kopiert")
    } catch {
      toast.error("Kunne ikke kopiere")
    }
  }

  if (household.isLoading || me.isLoading) {
    return (
      <section className="space-y-5 p-4" aria-label="Laster husholdning">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </section>
    )
  }

  if (household.isError || me.isError) {
    return (
      <section className="flex min-h-[280px] flex-col justify-center gap-4 p-4">
        <div>
          <h1 className="text-lg font-semibold">Kunne ikke laste husholdning</h1>
          <p className="text-sm text-muted-foreground">Prøv igjen.</p>
        </div>
        <Button className="w-fit" onClick={() => void household.refetch()}>
          Prøv igjen
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-8 p-4 pb-10">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Husholdning</h1>
        <p className="text-sm text-muted-foreground">Medlemmer og invitasjoner for denne kontoen.</p>
      </header>

      <div className="ring-foreground/8 rounded-3xl bg-card/80 p-5 shadow-sm ring-1">
        <h2 className="text-sm font-medium text-muted-foreground">Navn</h2>
        <p className="mt-1 font-heading text-lg font-semibold">{hName || "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Din rolle:{" "}
          <span className="text-foreground">{me.data?.householdRole === "eier" ? "Eier" : "Medlem"}</span>
        </p>
      </div>

      <div className="ring-foreground/8 rounded-3xl bg-card/80 p-5 shadow-sm ring-1">
        <h2 className="font-heading text-base font-medium">Medlemmer</h2>
        <ul className="mt-4 divide-y divide-border/80" aria-label="Medlemsliste">
          {household.data?.medlemmer.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium">
                  {m.brukernavn}
                  {m.erMeg ? <span className="text-muted-foreground"> (deg)</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {m.rolle === "eier" ? "Eier" : "Medlem"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isOwner ? (
        <div className="ring-foreground/8 rounded-3xl bg-card/80 p-5 shadow-sm ring-1">
          <h2 className="font-heading text-base font-medium">Invitasjonskode</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            En aktiv kode varer 7 dager og kan bare brukes én gang. Ny kode erstatter den forrige.
          </p>

          {active ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <code
                  className="rounded-xl bg-muted px-3 py-2 font-mono text-lg tracking-[0.18em]"
                  translate="no"
                >
                  {formatInviteForDisplay(active.code)}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => void copyCode(active.code)}
                >
                  <Copy className="size-4" aria-hidden />
                  Kopier
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Utløper {formatExpires(active.expiresAt)}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generateInvite.isPending}
                  onClick={() =>
                    void generateInvite.mutateAsync().then(() => toast.success("Ny kode er klar"))
                  }
                >
                  {generateInvite.isPending ? "Generer…" : "Erstatt kode"}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setRevokeOpen(true)}>
                  Trekk tilbake
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Ingen aktiv kode akkurat nå.</p>
              <Button
                type="button"
                disabled={generateInvite.isPending}
                onClick={() =>
                  void generateInvite.mutateAsync().then(() => toast.success("Invitasjonskode opprettet"))
                }
              >
                {generateInvite.isPending ? "Genererer…" : "Generer kode"}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Trekk tilbake invitasjon?</DialogTitle>
            <DialogDescription>
              Den nåværende koden slutter å virke umiddelbart. Du kan lage en ny senere.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRevokeOpen(false)}>
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={revokeInvite.isPending}
              onClick={() =>
                void revokeInvite.mutateAsync().then(() => {
                  toast.success("Invitasjon trukket tilbake")
                  setRevokeOpen(false)
                })
              }
            >
              {revokeInvite.isPending ? "Trekk tilbake…" : "Trekk tilbake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
