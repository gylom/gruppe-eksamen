import { Button } from "~/components/ui/button"

type RouteErrorRetryProps = {
  title: string
  hint: string
  retryLabel: string
  onRetry: () => void
  busy?: boolean
}

export function RouteErrorRetry({
  title,
  hint,
  retryLabel,
  onRetry,
  busy,
}: RouteErrorRetryProps) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4" role="alert">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <Button type="button" size="sm" className="mt-3" disabled={busy} onClick={() => onRetry()}>
        {retryLabel}
      </Button>
    </div>
  )
}
