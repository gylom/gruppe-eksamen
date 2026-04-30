import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, Link } from "react-router"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { ApiError, apiFetch } from "~/lib/api-fetch"
import { setToken } from "~/lib/auth"
import { queryClient } from "~/lib/query-client"

import type { AuthResponse, MeResponse } from "./types"

const schema = z.object({
  brukernavnEllerEmail: z.string().min(1, "Påkrevd"),
  passord: z.string().min(1, "Påkrevd"),
})

type LoginValues = z.infer<typeof schema>

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
  const [topError, setTopError] = useState<string | null>(null)
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
        setTopError("Noe gikk galt. Prøv igjen.")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <h1 className="text-2xl font-semibold">Logg inn</h1>

      {topError && (
        <p role="alert" className="text-sm text-destructive">
          {topError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="brukernavnEllerEmail">Brukernavn eller e-post</Label>
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
        <Label htmlFor="passord">Passord</Label>
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
        {isSubmitting ? "Logger inn…" : "Logg inn"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Trenger du en konto?{" "}
        <Link to="/register" className="underline">
          Registrer deg
        </Link>
      </p>
    </form>
  )
}
