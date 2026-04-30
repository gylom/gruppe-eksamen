import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { getToken } from "~/lib/auth"

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasToken = getToken() !== null

  useEffect(() => {
    if (hasToken) {
      navigate("/app", { replace: true })
    }
  }, [hasToken, navigate])

  if (hasToken) {
    return null
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">{t("home.title")}</h1>
          <p>{t("home.body")}</p>
        </div>
      </div>
    </div>
  )
}
