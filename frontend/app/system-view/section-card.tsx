import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

interface SectionCardProps {
  title: string
  description?: string
  className?: string
  children: ReactNode
}

export function SectionCard({ title, description, className, children }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <header className="mb-4">
        <h2 className="font-heading text-lg font-medium text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

// Native <select> styled to match the rest of the app — used everywhere in
// system-view because we surface dozens of dropdowns and the base-ui Select
// would balloon the JSX without changing functionality.
export const selectClass =
  "h-9 w-full rounded-md border border-input bg-input/30 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
