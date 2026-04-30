import { useEffect } from "react"
import { useNavigate } from "react-router"

import { Button } from "~/components/ui/button"
import { useLogout } from "~/features/auth/use-logout"
import { useMe } from "~/features/auth/use-me"
import { getToken } from "~/lib/auth"

export default function OnboardingRoute() {
  const navigate = useNavigate()
  const logout = useLogout()
  const me = useMe()
  const hasToken = getToken() !== null
  const hasHousehold = me.data?.householdId !== null && me.data?.householdId !== undefined

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

  if (me.isError) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
        <section className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Kunne ikke laste konto.</h1>
            <p className="text-sm text-muted-foreground">Prøv igjen.</p>
          </div>
          <Button className="w-fit" onClick={() => void me.refetch()}>
            Prøv igjen
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
      <section className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Velkommen</h1>
          <p className="mt-2 text-sm text-muted-foreground">Onboarding kommer i Story 1.4.</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logg ut
        </Button>
      </section>
    </main>
  )
}
