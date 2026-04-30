import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("app", "routes/app/layout.tsx", [
    index("routes/app/index.tsx"),
    route("chef", "routes/app/chef.tsx"),
    route("plan", "routes/app/plan.tsx"),
    route("shop", "routes/app/shop.tsx"),
    route("book", "routes/app/book.tsx"),
    route("account", "routes/app/account.tsx"),
  ]),
] satisfies RouteConfig
