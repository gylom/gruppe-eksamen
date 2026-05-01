import { Navigate } from "react-router"

export default function AppIndexRoute() {
  return <Navigate to="/app/recipes" replace />
}
