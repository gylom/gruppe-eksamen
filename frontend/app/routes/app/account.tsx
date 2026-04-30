import { Copy } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import {
  LanguagePreferenceControl,
  SettingSection,
  ThemePreferenceControl,
} from "~/features/settings"
import { useLogout } from "~/features/auth/use-logout"
import { useMe } from "~/features/auth/use-me"
import { formatInviteForDisplay } from "~/features/household/invite-input"
import { useGenerateInvite, useHousehold, useRevokeInvite } from "~/features/household/use-household"
import { getDateLocaleTag } from "~/lib/i18n"
import { ApiError } from "~/lib/api-fetch"

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  return fallback
}

function formatExpires(iso: string, localeTag: string): string {
  try {
    return new Date(iso).toLocaleString(localeTag, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export default function AccountRoute() {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const household = useHousehold()
  const generateInvite = useGenerateInvite()
  const revokeInvite = useRevokeInvite()
  const logout = useLogout()
  const [revokeOpen, setRevokeOpen] = useState(false)

  const isOwner = me.data?.householdRole === "eier"
  const hName = household.data?.household?.navn ?? me.data?.householdName ?? ""
  const active = household.data?.activeInvite
  const inviteBusy = generateInvite.isPending || revokeInvite.isPending
  const dateLocale = getDateLocaleTag(i18n.language)

  async function handleGenerate(successMessage: string) {
    try {
      await generateInvite.mutateAsync()
      toast.success(successMessage)
    } catch (err) {
      toast.error(errorMessage(err, t("account.errGenerate")))
    }
  }

  async function handleRevoke() {
    try {
      await revokeInvite.mutateAsync()
      toast.success(t("account.toastRevoked"))
      setRevokeOpen(false)
    } catch (err) {
      toast.error(errorMessage(err, t("account.errRevoke")))
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(t("account.toastCopied"))
    } catch {
      toast.error(t("account.errCopy"))
    }
  }

  if (household.isLoading || me.isLoading) {
    return (
      <section className="space-y-5 p-4" aria-label={t("account.loadingHousehold")}>
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
          <h1 className="text-lg font-semibold">{t("account.loadErrorTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("onboarding.tryAgainHint")}</p>
        </div>
        <Button className="w-fit" onClick={() => void household.refetch()}>
          {t("common.retry")}
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-8 p-4 pb-10">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">{t("account.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("account.pageSubtitle")}</p>
      </header>

      <SettingSection title={t("account.userSection")}>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("account.username")}</p>
            <p className="mt-0.5 font-medium">{me.data?.brukernavn ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("account.email")}</p>
            <p className="mt-0.5 break-all">{me.data?.email ?? "—"}</p>
          </div>
        </div>
      </SettingSection>

      <SettingSection title={t("account.householdSection")}>
        <h2 className="text-sm font-medium text-muted-foreground">{t("account.nameLabel")}</h2>
        <p className="mt-1 font-heading text-lg font-semibold">{hName || "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("account.yourRole")}{" "}
          <span className="text-foreground">
            {me.data?.householdRole === "eier" ? t("account.roleOwner") : t("account.roleMember")}
          </span>
        </p>
      </SettingSection>

      <SettingSection title={t("account.membersTitle")}>
        <ul className="divide-y divide-border/80" aria-label={t("account.membersListLabel")}>
          {household.data?.medlemmer.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-medium">
                  {m.brukernavn}
                  {m.erMeg ? <span className="text-muted-foreground"> ({t("common.you")})</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {m.rolle === "eier" ? t("account.roleOwner") : t("account.roleMember")}
              </span>
            </li>
          ))}
        </ul>
      </SettingSection>

      {isOwner ? (
        <SettingSection title={t("account.inviteTitle")} description={t("account.inviteHelp")}>
          {active ? (
            <div className="space-y-3">
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
                  {t("common.copy")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("common.expires", { date: formatExpires(active.expiresAt, dateLocale) })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={inviteBusy}
                  onClick={() => void handleGenerate(t("account.toastCodeReady"))}
                >
                  {generateInvite.isPending ? t("account.inviteGenerating") : t("common.replace")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={inviteBusy}
                  onClick={() => setRevokeOpen(true)}
                >
                  {t("common.revoke")}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">{t("account.noActiveCode")}</p>
              <Button
                type="button"
                disabled={inviteBusy}
                onClick={() => void handleGenerate(t("account.toastInviteCreated"))}
              >
                {generateInvite.isPending ? t("account.generating") : t("common.generate")}
              </Button>
            </div>
          )}
        </SettingSection>
      ) : null}

      <SettingSection title={t("account.preferencesSection")}>
        <div className="space-y-6">
          <LanguagePreferenceControl />
          <ThemePreferenceControl />
        </div>
      </SettingSection>

      <Button type="button" variant="outline" className="mx-auto flex w-full min-h-11 max-w-md" onClick={() => logout()}>
        {t("common.logout")}
      </Button>

      <Dialog
        open={revokeOpen}
        onOpenChange={(next) => {
          if (revokeInvite.isPending) return
          setRevokeOpen(next)
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("account.revokeTitle")}</DialogTitle>
            <DialogDescription>{t("account.revokeDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={revokeInvite.isPending}
              onClick={() => setRevokeOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={revokeInvite.isPending}
              onClick={() => void handleRevoke()}
            >
              {revokeInvite.isPending ? t("account.inviteRevoking") : t("common.revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
