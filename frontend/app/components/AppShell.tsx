import type { ReactNode } from "react"

import { BottomNav } from "./BottomNav"

interface AppShellProps {
  children: ReactNode
  headerSlot?: ReactNode
  reserveNav?: boolean
}

export function AppShell({ children, headerSlot, reserveNav = false }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col bg-background">
      {headerSlot}
      <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]">
        {children}
      </main>
      {reserveNav ? (
        <div
          aria-hidden="true"
          className="sticky bottom-0 h-16 shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)]"
        />
      ) : (
        <BottomNav />
      )}
    </div>
  )
}
