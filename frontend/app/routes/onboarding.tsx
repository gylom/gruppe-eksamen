import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useLogout } from "~/features/auth/use-logout"
import { useMe } from "~/features/auth/use-me"
import { normalizeInviteInput } from "~/features/household/invite-input"
import { useCreateHousehold, useJoinHousehold } from "~/features/household/use-household"
import { ApiError } from "~/lib/api-fetch"
import { getToken } from "~/lib/auth"

const createSchema = z.object({
  navn: z.string().trim().min(1, "Gi husholdningen et navn."),
})

const joinSchema = z.object({
  code: z
    .string()
    .length(6, "Koden må være nøyaktig 6 tegn.")
    .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/, "Kun tillatte tegn (ingen I, L, O, 0 eller 1)."),
})

type CreateValues = z.infer<typeof createSchema>
type JoinValues = z.infer<typeof joinSchema>

export default function OnboardingRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useLogout()
  const me = useMe()
  const createHousehold = useCreateHousehold()
  const joinHousehold = useJoinHousehold()

  const hasToken = getToken() !== null
  const hasHousehold = me.data != null && me.data.householdId != null

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { navn: "" },
    mode: "onBlur",
  })

  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { code: "" },
    mode: "onChange",
  })

  useEffect(() => {
    if (!hasToken) {
      navigate("/login", { replace: true })
    }
  }, [hasToken, navigate])

  useEffect(() => {
    if (hasToken && hasHousehold) {
      navigate("/app", { replace: true })
    }
  }, [hasHousehold, hasToken, navigate])

  async function refreshMeAndGoApp(message: string) {
    await queryClient.invalidateQueries({ queryKey: ["me"] })
    await queryClient.refetchQueries({ queryKey: ["me"] })
    toast.success(message)
    navigate("/app", { replace: true })
  }

  async function onCreate(values: CreateValues) {
    createForm.clearErrors("root")
    try {
      await createHousehold.mutateAsync({ navn: values.navn.trim() })
      await refreshMeAndGoApp("Husholdning opprettet")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Noe gikk galt."
      createForm.setError("root", { message: msg })
    }
  }

  async function onJoin(values: JoinValues) {
    joinForm.clearErrors("root")
    try {
      await joinHousehold.mutateAsync({ code: values.code })
      await refreshMeAndGoApp("Du er med i husholdningen")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Noe gikk galt."
      joinForm.setError("root", { message: msg })
    }
  }

  if (!hasToken || hasHousehold) {
    return null
  }

  if (me.isLoading) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
        <div className="space-y-3" aria-label="Laster onboarding">
          <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </main>
    )
  }

  if (me.isError && !me.data) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
        <section className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Kunne ikke laste konto.</h1>
            <p className="text-sm text-muted-foreground">Prøv igjen.</p>
          </div>
          <Button className="w-fit" disabled={me.isFetching} onClick={() => void me.refetch()}>
            Prøv igjen
          </Button>
        </section>
      </main>
    )
  }

  const busy = createHousehold.isPending || joinHousehold.isPending

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-gradient-to-b from-primary/[0.06] via-background to-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,oklch(0.78_0.08_330/0.35),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-10">
        <header className="space-y-2">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Steg 1 av 1</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Sett opp husholdning</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Opprett ny husholdning eller lim inn invitasjonskode du har fått av eier.
          </p>
        </header>

        <section
          className="ring-foreground/8 rounded-3xl bg-card/90 p-5 shadow-sm ring-1 backdrop-blur-sm"
          aria-labelledby="create-heading"
        >
          <h2 id="create-heading" className="font-heading text-base font-medium">
            Opprett husholdning
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Du blir eier og kan invitere andre senere.</p>
          <form className="mt-4 space-y-3" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="onboarding-house-name">Navn</Label>
              <Input
                id="onboarding-house-name"
                autoComplete="organization"
                placeholder="F.eks. Kollektivet"
                disabled={busy}
                {...createForm.register("navn")}
                aria-invalid={!!createForm.formState.errors.navn}
              />
              {createForm.formState.errors.navn && (
                <p className="text-destructive text-sm" role="alert">
                  {createForm.formState.errors.navn.message}
                </p>
              )}
            </div>
            {createForm.formState.errors.root && (
              <p className="text-destructive text-sm" role="alert">
                {createForm.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {createHousehold.isPending ? "Oppretter…" : "Opprett og fortsett"}
            </Button>
          </form>
        </section>

        <section
          className="ring-foreground/8 rounded-3xl bg-card/90 p-5 shadow-sm ring-1 backdrop-blur-sm"
          aria-labelledby="join-heading"
        >
          <h2 id="join-heading" className="font-heading text-base font-medium">
            Bli med i husholdning
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">6 tegn, store bokstaver og tall (ingen I/L/O/0/1).</p>
          <form className="mt-4 space-y-3" onSubmit={joinForm.handleSubmit(onJoin)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="onboarding-invite-code">Invitasjonskode</Label>
              <Controller
                name="code"
                control={joinForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="onboarding-invite-code"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="font-mono text-lg tracking-[0.2em]"
                    disabled={busy}
                    aria-invalid={!!joinForm.formState.errors.code}
                    onChange={(e) => field.onChange(normalizeInviteInput(e.target.value))}
                  />
                )}
              />
              {joinForm.formState.errors.code && (
                <p className="text-destructive text-sm" role="alert">
                  {joinForm.formState.errors.code.message}
                </p>
              )}
            </div>
            {joinForm.formState.errors.root && (
              <p className="text-destructive text-sm" role="alert">
                {joinForm.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
              {joinHousehold.isPending ? "Melder inn…" : "Bli med"}
            </Button>
          </form>
        </section>

        <footer className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <p className="text-center text-xs text-muted-foreground">Feil konto?</p>
          <Button type="button" variant="outline" className="w-full" onClick={logout}>
            Logg ut
          </Button>
        </footer>
      </div>
    </main>
  )
}
