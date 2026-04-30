import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"

import { AppShell } from "~/components/AppShell"
import { Button } from "~/components/ui/button"
import { useMe } from "~/features/auth/use-me"
import { getToken } from "~/lib/auth"

export default function AppLayoutRoute() {
  const navigate = useNavigate()
  const me = useMe()
  const hasToken = getToken() !== null
  const hasNoHousehold = me.data?.householdId === null

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
        <section className="space-y-5 p-4" aria-label="Laster konto">
          <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          </div>
        </section>
      </AppShell>
    )
  }

  if (me.isError) {
    return (
      <AppShell reserveNav>
        <section className="flex min-h-[320px] flex-col justify-center gap-4 p-4">
          <div>
            <h1 className="text-lg font-semibold">Kunne ikke laste konto.</h1>
            <p className="text-sm text-muted-foreground">Prøv igjen.</p>
          </div>
          <Button className="w-fit" onClick={() => void me.refetch()}>
            Prøv igjen
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
