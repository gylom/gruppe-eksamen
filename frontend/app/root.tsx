import i18n from "~/lib/i18n"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import { ThemeProvider, themeInitScript } from "~/components/theme-provider"
import { Toaster } from "~/components/ui/sonner"
import { queryClient } from "~/lib/query-client"

import type { Route } from "./+types/root"
import "./app.css"
import "react-swipeable-list/dist/styles.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = i18n.t("errors.oops")
  let details = i18n.t("errors.unexpected")
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? i18n.t("errors.notFoundTitle") : i18n.t("errors.errorTitle")
    details =
      error.status === 404
        ? i18n.t("errors.notFound")
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
