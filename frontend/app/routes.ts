import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("app", "routes/app/layout.tsx", [
    index("routes/app/index.tsx"),
    route("recipes", "routes/app/chef.tsx"),
    route("meals", "routes/app/plan.tsx"),
    route("groceries", "routes/app/shop.tsx"),
    route("cookbook", "routes/app/book.tsx"),
    route("account", "routes/app/account.tsx"),
  ]),
] satisfies RouteConfig
