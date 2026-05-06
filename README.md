# gruppe-eksamen
Eksamen Gokstad Akademiet


# Quick start

## Requirements
- Docker Desktop
- .NET SDK
- Node.js + npm

## Windows
### Open  Rider, VSCode or other IDE terminal and paste commands:
```bash
npm install
npm run start:win
```


# Daily Workflow

git pull
(make changes)

git add .

(git add .) adds all files to be changed/pushed

(git add program.cs) only adds program.cs file to be changed/pushed

(git add folder-name/) = all files in folder for example (git add backend/  )

git commit -m "describe change"

git push


# Deploy to Railway

The repo ships with a multi-stage [Dockerfile](Dockerfile) that builds the React frontend into the .NET backend's `wwwroot/`, so one Railway service runs both. A second service hosts MySQL.

## Required env vars on the app service
- `ConnectionStrings__DefaultConnection` — e.g. `Server=${{MySQL.MYSQLHOST}};Port=${{MySQL.MYSQLPORT}};Database=${{MySQL.MYSQLDATABASE}};User=${{MySQL.MYSQLUSER}};Password=${{MySQL.MYSQLPASSWORD}};CharSet=utf8mb4;`
- `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`
- `ASPNETCORE_ENVIRONMENT=Production`

The backend also accepts `MYSQLHOST` / `MYSQLPORT` / `MYSQLDATABASE` / `MYSQLUSER` / `MYSQLPASSWORD` directly as a fallback if `ConnectionStrings__DefaultConnection` is not set.

## Seed the database
After the MySQL service is up, run the SQL files in `database/` against it (schema first, then the seed files in the order in [scripts/setup-db.ps1](scripts/setup-db.ps1)).

