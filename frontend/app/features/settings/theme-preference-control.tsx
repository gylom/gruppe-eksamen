import type { TFunction } from "i18next"
import { ChevronDown, MoonIcon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useTheme, type Theme } from "~/components/theme-provider"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

function themeLabel(t: TFunction, theme: Theme): string {
  if (theme === "light") return t("preferences.themeLight")
  if (theme === "dark") return t("preferences.themeDark")
  return t("preferences.themeSystem")
}

export function ThemePreferenceControl() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  function applyTheme(next: Theme) {
    setTheme(next)
    toast.success(t("preferences.themeApplied"))
  }

  return (
    <div className="space-y-2">
      <p id="theme-preference-label" className="text-xs font-medium text-muted-foreground">
        {t("preferences.theme")}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="relative h-auto min-h-11 w-full max-w-full justify-between gap-2 px-3 py-2 text-left font-normal"
              aria-labelledby="theme-preference-label"
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="relative h-[1.15rem] w-[1.15rem] shrink-0">
              <SunIcon
                className="absolute inset-0 h-[1.15rem] w-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
                aria-hidden
              />
              <MoonIcon
                className="absolute inset-0 h-[1.15rem] w-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
                aria-hidden
              />
            </span>
            <span className="min-w-0 truncate">{t("preferences.themeChoice", { label: themeLabel(t, theme) })}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[min(100vw-2rem,22rem)]">
          <DropdownMenuItem onClick={() => applyTheme("light")}>{t("preferences.themeLight")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyTheme("dark")}>{t("preferences.themeDark")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => applyTheme("system")}>{t("preferences.themeSystem")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
