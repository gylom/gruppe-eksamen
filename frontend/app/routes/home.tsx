import { useEffect } from "react"
import { useNavigate } from "react-router"

import { getToken } from "~/lib/auth"

export default function Home() {
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
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
        </div>
      </div>
    </div>
  )
}
