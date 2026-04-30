import { RegisterForm } from "~/features/auth/register-form"

export default function RegisterRoute() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
      <RegisterForm />
    </main>
  )
}
