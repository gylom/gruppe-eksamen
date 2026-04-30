import { useNavigate } from "react-router"

import { clearAuth } from "~/lib/auth"
import { queryClient } from "~/lib/query-client"

export function useLogout() {
  const navigate = useNavigate()
  return () => {
    clearAuth()
    queryClient.clear()
    navigate("/login")
  }
}
