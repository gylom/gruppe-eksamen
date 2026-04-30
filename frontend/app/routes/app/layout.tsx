import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate } from "react-router"

import { AppShell } from "~/components/AppShell"
import { Button } from "~/components/ui/button"
import { useMe } from "~/features/auth/use-me"
import { getToken } from "~/lib/auth"

export default function AppLayoutRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const me = useMe()
  const hasToken = getToken() !== null
  // Only treat "no household" as authoritative when the query is settled.
  // While me is refetching (e.g. immediately after onboarding invalidates the
  // cache), we'd otherwise flicker back to /onboarding using stale data.
  const meSettled = me.data != null && !me.isFetching
  const hasNoHousehold = meSettled && me.data.householdId == null

  useEffect(() => {
    if (!hasToken) {
      navigate("/login", { replace: true })
    }
  }, [hasToken, navigate])

  useEffect(() => {
    if (hasToken && hasNoHousehold) {
      navigate("/onboarding", { replace: true })
    }
  }, [hasNoHousehold, hasToken, navigate])

  if (!hasToken || hasNoHousehold) {
    return null
  }

  if (me.isLoading) {
    return (
      <AppShell reserveNav>
        <section className="space-y-5 p-4" aria-label={t("appLayout.loadingAccount")}>
          <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          </div>
        </section>
      </AppShell>
    )
  }

  if (me.isError && !me.data) {
    return (
      <AppShell reserveNav>
        <section className="flex min-h-[320px] flex-col justify-center gap-4 p-4">
          <div>
            <h1 className="text-lg font-semibold">{t("appLayout.loadErrorTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.tryAgainHint")}</p>
          </div>
          <Button className="w-fit" disabled={me.isFetching} onClick={() => void me.refetch()}>
            {t("common.retry")}
          </Button>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
