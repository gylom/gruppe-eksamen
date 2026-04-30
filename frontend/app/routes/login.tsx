import { LoginForm } from "~/features/auth/login-form"

export default function LoginRoute() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8">
      <LoginForm />
    </main>
  )
}
