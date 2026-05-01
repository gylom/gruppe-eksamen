# Deploy to Railway

End-to-end walkthrough for hosting this app (backend + MySQL + bundled frontend) on Railway. Reflects the actual setup we landed on.

## Architecture on Railway

One Railway project with two services:

- **MySQL** — managed database from Railway's template (mysql:9.4).
- **backend** — the .NET 8 app, built from the repo's root [`Dockerfile`](../Dockerfile). The same image also serves the built React Router SPA from `backend/wwwroot/`.

One service, one domain, no CORS split.

---

## Stage 0 — Code prep

No `appsettings.json` edits needed — .NET binds env vars like `ConnectionStrings__DefaultConnection` and `Jwt__Key` directly onto config keys. We deploy via Docker, so the build is fully reproducible.

### Files added to the repo

- [`Dockerfile`](../Dockerfile) — multi-stage build (Node → .NET SDK → ASP.NET runtime). Builds the React Router SPA, copies `frontend/build/client` into `backend/wwwroot`, then runs `dotnet publish`. Final stage exposes port 8080.
- [`.dockerignore`](../.dockerignore) — excludes `node_modules`, `bin/`, `obj/`, `build/`, `_bmad*`, `client-react/`, archived docs.
- [`scripts/seed-railway-db.mjs`](../scripts/seed-railway-db.mjs) — Node script that loads `database/schema.sql` + seeds against Railway's MySQL via the public TCP proxy.

### Why Docker instead of Nixpacks/Railpack

Two reasons: this stack mixes Node + .NET (Nixpacks needs a custom config), and the React Router build output has to land inside `backend/wwwroot/` before `dotnet publish`. A Dockerfile makes that ordering explicit.

---

## Stage 1 — Authenticate & link

```powershell
railway login
railway link              # pick workspace → project → environment → MySQL service
```

Verify:

```powershell
railway status --json
```

> If a project doesn't exist yet, run `railway init --name <name>` first.

---

## Stage 2 — Provision MySQL

```powershell
railway add --database mysql
```

Creates a `MySQL` service with these reference variables (usable as `${{MySQL.VAR}}` from sibling services):

- `MYSQLHOST` (private, e.g. `mysql.railway.internal`)
- `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
- `MYSQL_PUBLIC_URL` — public TCP proxy URL for connecting from your laptop

---

## Stage 3 — Load schema + seed data

The repo has no EF migrations — schema lives in raw SQL files under [`database/`](../database/). The shipped [`schema.sql`](../database/schema.sql) already includes everything the `v*.sql` migrations originally added, so a fresh DB only needs `schema.sql` + seeds (mirroring [`scripts/setup-db.ps1`](../scripts/setup-db.ps1)).

[`scripts/seed-railway-db.mjs`](../scripts/seed-railway-db.mjs) handles this. It prefers `MYSQL_PUBLIC_URL` (works from your laptop) and falls back to discrete `MYSQL*` vars (works inside Railway's network).

```powershell
# One-time mysql2 driver install (--no-save keeps package.json clean)
npm install --no-save mysql2

# Run with Railway's MySQL env vars injected
railway run --service MySQL node scripts/seed-railway-db.mjs
```

Expected output: each of the 20 SQL files applied in order, ending with `Done.`

> If you get `ENOTFOUND mysql.railway.internal`, the script is using the private hostname. The script auto-prefers `MYSQL_PUBLIC_URL` — if it doesn't have one, enable **Public Networking** on the MySQL service in the Railway dashboard.

---

## Stage 4 — Add the backend service & variables

```powershell
railway add --service backend     # press Esc when prompted for variables
```

Then set variables in one shot (PowerShell — note the backtick line continuations and the `` ` `` before each `${{...}}`):

```powershell
railway variables --service backend `
  --set "ConnectionStrings__DefaultConnection=server=`${{MySQL.MYSQLHOST}};port=`${{MySQL.MYSQLPORT}};database=`${{MySQL.MYSQLDATABASE}};user=`${{MySQL.MYSQLUSER}};password=`${{MySQL.MYSQLPASSWORD}};CharSet=utf8mb4;" `
  --set "ASPNETCORE_ENVIRONMENT=Production" `
  --set "Jwt__Key=<generated-secret>" `
  --set "Jwt__Issuer=matlager-api" `
  --set "Jwt__Audience=matlager-client"
```

Generate a JWT key (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

> No need to set `ASPNETCORE_URLS` — the Dockerfile pins it to `http://0.0.0.0:8080` and Railway routes the public proxy to that port.

Verify:

```powershell
railway variables --service backend --kv
```

`ConnectionStrings__DefaultConnection` should show with the actual MySQL host/credentials resolved.

---

## Stage 5 — Deploy & expose

Switch the linked service from MySQL to backend, then deploy from your local machine:

```powershell
railway service backend
railway up --detach
```

This zips the working directory (respecting [`.dockerignore`](../.dockerignore)), uploads it, and Railway builds via the [`Dockerfile`](../Dockerfile). First build takes 3–6 minutes.

Generate the public URL and tail logs:

```powershell
railway domain                       # e.g. https://backend-production-503a.up.railway.app
railway logs --service backend --lines 200
```

### Verification checklist

1. Build finished without errors.
2. Log line: `Now listening on: http://0.0.0.0:8080`.
3. Open the railway.app URL — React app loads.
4. Log in with a seeded user — JWT issued, DB reachable.

---

## Updating the deployed app

Same workflow as the initial deploy — `railway up` redeploys whatever's currently on disk:

```powershell
railway service backend         # if not already linked to backend
railway up --detach
railway logs --service backend  # watch the rollout
```

Notes:

- Uploads include uncommitted changes. Convenient, but be aware.
- Don't connect a GitHub repo through the Railway dashboard if you want to keep this manual workflow — connecting GitHub usually takes over deploys.

### Optional: GitHub auto-deploy

Open backend service → **Settings → Source → Connect Repo** → pick the repo and branch (e.g. `feature/frontend-rebuild`). Leave **Root Directory** blank. Every push to that branch then triggers a build.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `ENOTFOUND mysql.railway.internal` from local script | Trying to use the private hostname from your laptop | Use `MYSQL_PUBLIC_URL` (the seed script does this automatically); enable Public Networking on the MySQL service if missing. |
| Connection refused from backend → DB at runtime | Reference variable not resolved | `railway variables --service backend --kv` should show the actual MySQL host, not `${{MySQL.MYSQLHOST}}`. |
| `Application failed to respond` / "Not Found" page | App not listening on the proxied port | Logs should show `Now listening on: http://0.0.0.0:8080`. The Dockerfile pins this — don't override `ASPNETCORE_URLS` to a different port. |
| Build fails restoring NuGet packages | .NET SDK version mismatch | The Dockerfile uses `mcr.microsoft.com/dotnet/sdk:8.0`. If you upgrade `<TargetFramework>` in `backend.csproj`, bump the image tag too. |
| Frontend 404s on direct route hits | `MapFallbackToFile` not finding `index.html` | Confirm the build copied `frontend/build/client/*` into `backend/wwwroot/` — should happen automatically via the Dockerfile stage. |
| `Table doesn't exist` errors | Stage 3 didn't run, or partial | Re-run `railway run --service MySQL node scripts/seed-railway-db.mjs`. The script is idempotent for `CREATE TABLE IF NOT EXISTS`-style statements but not for raw `CREATE TABLE` — drop the database first if needed. |

---

## What's NOT covered

- **Custom domain** — `railway domain <yourdomain.com>` then set the CNAME at your DNS provider.
- **Staging environment** — `railway environment new staging` clones config; target with `--environment staging`.
- **PR preview environments** — available via the GitHub integration.
- **Backups** — Railway MySQL has automated backups on paid plans; verify before relying on it.
- **Secret rotation** — JWT key and DB password are persistent across deploys until you rotate them in the Railway dashboard.
