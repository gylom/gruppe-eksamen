import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, Link } from "react-router"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { ApiError, apiFetch } from "~/lib/api-fetch"
import { setToken } from "~/lib/auth"
import { queryClient } from "~/lib/query-client"

import type { AuthResponse, MeResponse } from "./types"

type LoginValues = {
  brukernavnEllerEmail: string
  passord: string
}

function deriveMeFromAuthResponse(auth: AuthResponse): MeResponse {
  return {
    userId: auth.userId,
    brukernavn: auth.brukernavn,
    email: auth.email,
    householdId: auth.householdId,
    householdName: auth.householdName,
    householdRole: null,
  }
}

export function LoginForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [topError, setTopError] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        brukernavnEllerEmail: z.string().min(1, t("validation.required")),
        passord: z.string().min(1, t("validation.required")),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { brukernavnEllerEmail: "", passord: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    setTopError(null)
    try {
      const response = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: values,
      })
      setToken(response.token)
      queryClient.setQueryData(["me"], deriveMeFromAuthResponse(response))
      navigate("/app")
    } catch (err) {
      if (err instanceof ApiError) {
        setTopError(err.message)
      } else {
        setTopError(t("common.genericError"))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>

      {topError && (
        <p role="alert" className="text-sm text-destructive">
          {topError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="brukernavnEllerEmail">{t("auth.usernameOrEmail")}</Label>
        <Input
          id="brukernavnEllerEmail"
          type="text"
          autoComplete="username"
          aria-required="true"
          aria-invalid={!!errors.brukernavnEllerEmail}
          {...register("brukernavnEllerEmail")}
        />
        {errors.brukernavnEllerEmail && (
          <p className="text-sm text-destructive">{errors.brukernavnEllerEmail.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="passord">{t("auth.password")}</Label>
        <Input
          id="passord"
          type="password"
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={!!errors.passord}
          {...register("passord")}
        />
        {errors.passord && <p className="text-sm text-destructive">{errors.passord.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("auth.loggingIn") : t("auth.loginCta")}
      </Button>

      <p className="text-sm text-muted-foreground">
        {t("auth.needAccount")}{" "}
        <Link to="/register" className="underline">
          {t("auth.registerLink")}
        </Link>
      </p>
    </form>
  )
}
