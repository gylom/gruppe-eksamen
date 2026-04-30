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
  brukernavn: z.string().min(2, "Minst 2 tegn"),
  email: z.string().email("Ugyldig e-postadresse"),
  passord: z.string().min(8, "Minst 8 tegn"),
  fullName: z.string().optional(),
})

type RegisterValues = z.infer<typeof schema>

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

export function RegisterForm() {
  const navigate = useNavigate()
  const [topError, setTopError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { brukernavn: "", email: "", passord: "", fullName: "" },
  })

  const onSubmit = async (values: RegisterValues) => {
    setTopError(null)
    try {
      const response = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: values,
      })
      setToken(response.token)
      queryClient.setQueryData(["me"], deriveMeFromAuthResponse(response))
      navigate("/app")
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.message
        if (msg.includes("Brukernavn")) {
          setError("brukernavn", { message: msg })
        } else if (msg.includes("Email") || msg.includes("E-post") || msg.includes("E-mail")) {
          setError("email", { message: msg })
        } else {
          setTopError(msg)
        }
      } else {
        setTopError("Noe gikk galt. Prøv igjen.")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <h1 className="text-2xl font-semibold">Registrer</h1>

      {topError && (
        <p role="alert" className="text-sm text-destructive">
          {topError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="brukernavn">Brukernavn</Label>
        <Input
          id="brukernavn"
          type="text"
          autoComplete="username"
          aria-required="true"
          aria-invalid={!!errors.brukernavn}
          {...register("brukernavn")}
        />
        {errors.brukernavn && <p className="text-sm text-destructive">{errors.brukernavn.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="passord">Passord</Label>
        <Input
          id="passord"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={!!errors.passord}
          {...register("passord")}
        />
        {errors.passord && <p className="text-sm text-destructive">{errors.passord.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Fullt navn (valgfritt)</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registrerer…" : "Registrer"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Har du allerede en konto?{" "}
        <Link to="/login" className="underline">
          Logg inn
        </Link>
      </p>
    </form>
  )
}
