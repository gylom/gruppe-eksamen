import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
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
import { getToken } from "~/lib/auth"

type CreateValues = { navn: string }
type JoinValues = { code: string }

export default function OnboardingRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useLogout()
  const me = useMe()
  const createHousehold = useCreateHousehold()
  const joinHousehold = useJoinHousehold()

  const createSchema = useMemo(
    () =>
      z.object({
        navn: z.string().trim().min(1, t("validation.householdName")),
      }),
    [t]
  )

  const joinSchema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .length(6, t("validation.inviteLength"))
          .regex(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/, t("validation.inviteChars")),
      }),
    [t]
  )

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

  const hasToken = getToken() !== null
  const hasHousehold = me.data != null && me.data.householdId != null

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
    try {
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.refetchQueries({ queryKey: ["me"] })
    } catch {
      // /api/auth/me failures are recoverable — the layout will refetch and
      // the route guards will redirect if the new household state is missing.
    }
    toast.success(message)
    navigate("/app", { replace: true })
  }

  async function onCreate(values: CreateValues) {
    createForm.clearErrors("root")
    try {
      await createHousehold.mutateAsync({ navn: values.navn.trim() })
      await refreshMeAndGoApp(t("onboarding.toastCreated"))
    } catch {
      createForm.setError("root", { message: t("onboarding.oops") })
    }
  }

  async function onJoin(values: JoinValues) {
    joinForm.clearErrors("root")
    try {
      await joinHousehold.mutateAsync({ code: values.code })
      await refreshMeAndGoApp(t("onboarding.toastJoined"))
    } catch {
      joinForm.setError("root", { message: t("onboarding.oops") })
    }
  }

  if (!hasToken || hasHousehold) {
    return null
  }

  if (me.isLoading) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
        <div className="space-y-3" aria-label={t("onboarding.loading")}>
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
            <h1 className="text-lg font-semibold">{t("onboarding.loadErrorTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.tryAgainHint")}</p>
          </div>
          <Button className="w-fit" disabled={me.isFetching} onClick={() => void me.refetch()}>
            {t("common.retry")}
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
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{t("onboarding.stepLabel")}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{t("onboarding.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("onboarding.subtitle")}</p>
        </header>

        <section
          className="ring-foreground/8 rounded-3xl bg-card/90 p-5 shadow-sm ring-1 backdrop-blur-sm"
          aria-labelledby="create-heading"
        >
          <h2 id="create-heading" className="font-heading text-base font-medium">
            {t("onboarding.createTitle")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("onboarding.createHint")}</p>
          <form className="mt-4 space-y-3" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="onboarding-house-name">{t("onboarding.nameLabel")}</Label>
              <Input
                id="onboarding-house-name"
                autoComplete="organization"
                placeholder={t("onboarding.namePlaceholder")}
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
              {createHousehold.isPending ? t("onboarding.creating") : t("onboarding.createSubmit")}
            </Button>
          </form>
        </section>

        <section
          className="ring-foreground/8 rounded-3xl bg-card/90 p-5 shadow-sm ring-1 backdrop-blur-sm"
          aria-labelledby="join-heading"
        >
          <h2 id="join-heading" className="font-heading text-base font-medium">
            {t("onboarding.joinTitle")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("onboarding.joinHint")}</p>
          <form className="mt-4 space-y-3" onSubmit={joinForm.handleSubmit(onJoin)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="onboarding-invite-code">{t("onboarding.codeLabel")}</Label>
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
              {joinHousehold.isPending ? t("onboarding.joining") : t("onboarding.joinSubmit")}
            </Button>
          </form>
        </section>

        <footer className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <p className="text-center text-xs text-muted-foreground">{t("onboarding.wrongAccount")}</p>
          <Button type="button" variant="outline" className="w-full" onClick={logout}>
            {t("common.logout")}
          </Button>
        </footer>
      </div>
    </main>
  )
}
