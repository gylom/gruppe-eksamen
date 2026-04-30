import { ChevronDown, MoonIcon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { useTheme, type Theme } from "~/components/theme-provider"

function themeLabel(t: ReturnType<typeof useTranslation>["t"], theme: Theme): string {
  if (theme === "light") return t("preferences.themeLight")
  if (theme === "dark") return t("preferences.themeDark")
  return t("preferences.themeSystem")
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  function applyTheme(next: Theme) {
    setTheme(next)
    toast.success(t("preferences.themeApplied"))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-10 max-w-full justify-between gap-2 px-3 py-2 font-normal"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="relative h-[1.2rem] w-[1.2rem] shrink-0">
            <SunIcon className="absolute inset-0 h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute inset-0 h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </span>
          <span className="min-w-0 truncate">{t("preferences.themeChoice", { label: themeLabel(t, theme) })}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyTheme("light")}>{t("preferences.themeLight")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("dark")}>{t("preferences.themeDark")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyTheme("system")}>{t("preferences.themeSystem")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
