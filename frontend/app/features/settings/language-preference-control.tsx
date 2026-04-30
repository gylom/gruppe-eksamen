import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import type { AppLanguage } from "~/lib/i18n"
import { cn } from "~/lib/utils"

export function LanguagePreferenceControl() {
  const { t, i18n: i18nInstance } = useTranslation()
  const current = (i18nInstance.language.startsWith("en") ? "en" : "nb") as AppLanguage

  function select(next: AppLanguage) {
    if (next === current) return
    void i18nInstance.changeLanguage(next)
    toast.success(t("preferences.languageApplied"))
  }

  return (
    <div className="space-y-2">
      <p id="language-preference-label" className="text-xs font-medium text-muted-foreground">
        {t("preferences.language")}
      </p>
      <div
        role="radiogroup"
        aria-labelledby="language-preference-label"
        className="flex min-w-0 gap-2"
      >
        <Button
          type="button"
          role="radio"
          aria-checked={current === "nb"}
          variant={current === "nb" ? "secondary" : "outline"}
          className={cn("min-h-11 min-w-0 flex-1 shrink px-2 text-center")}
          onClick={() => select("nb")}
        >
          {t("preferences.languageNb")}
        </Button>
        <Button
          type="button"
          role="radio"
          aria-checked={current === "en"}
          variant={current === "en" ? "secondary" : "outline"}
          className={cn("min-h-11 min-w-0 flex-1 shrink px-2 text-center")}
          onClick={() => select("en")}
        >
          {t("preferences.languageEn")}
        </Button>
      </div>
    </div>
  )
}
