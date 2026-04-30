We’re creating a meal planner and we’re building on a backend that has almost everything needed to make this work. Backend is missing only

- persistence of selected weekly meals
- recipe-to-shopping list logic.
  We want to deploy both c# backend and react/vite front end to railway.

---

This is mobile first and should is multi-tennant. It’s mean for daily use and by a household that’s planning meal purchases together.

Routes:

- landing page (”/”)
- meal selection. (”/chef”)
- auth routes (”/login”, ”/register”)

UI views:

- user account view with household info. Show avatar and names of everyone in household.
- selected meals
- meal selection, grid view
- search meals with food category filters. (Filters such as meal type Indian, Italian, lunch, dinner etc.)
- shopping list
- cookbook
- onboarding and household setup

We want the app to have i18n and dark/light mode. We have installed shadcn vite/react starter template.
