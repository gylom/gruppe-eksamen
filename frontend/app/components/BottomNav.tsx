import { BookOpen, CalendarDays, ChefHat, ShoppingBasket, User } from "lucide-react"
import { NavLink } from "react-router"

import { cn } from "~/lib/utils"

const navItems = [
  { to: "/app/chef", label: "Kjøkken", Icon: ChefHat },
  { to: "/app/plan", label: "Plan", Icon: CalendarDays },
  { to: "/app/shop", label: "Handel", Icon: ShoppingBasket },
  { to: "/app/book", label: "Bok", Icon: BookOpen },
  { to: "/app/account", label: "Konto", Icon: User },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Hovednavigasjon"
      className="sticky bottom-0 shrink-0 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur"
    >
      <div className="grid h-16 grid-cols-5">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 rounded-sm px-1 text-xs text-muted-foreground transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isActive && "font-semibold text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full bg-transparent",
                    isActive && "bg-primary"
                  )}
                />
                <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                <span className="leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
