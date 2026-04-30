import type { ReactNode } from "react"

type SettingSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <div className="ring-foreground/8 rounded-3xl bg-card/80 p-5 shadow-sm ring-1">
      <h2 className="font-heading text-base font-medium">{title}</h2>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      <div className={description ? "mt-4" : "mt-3"}>{children}</div>
    </div>
  )
}
