Write-Host "Cleaning up old backend and Docker resources..."

$ErrorActionPreference = "Stop"

# Kill old backend process if it is still running
Get-Process backend -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop and remove containers, networks, and volumes for a fully clean DB start
docker compose down -v | Out-Null 2>&1

# Extra safety: remove container directly if it still exists
try {
    docker rm -f matlager-mysql | Out-Null
} catch {}

Write-Host "Starting MySQL container with docker compose..."
docker compose up -d

Write-Host "Waiting for container to exist..."
$containerReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $containerId = docker ps -q -f "name=matlager-mysql"
    if ($containerId) {
        $containerReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $containerReady) {
    throw "matlager-mysql container did not start."
}

Write-Host "Waiting for MySQL container healthcheck to become healthy..."
$mysqlReady = $false
for ($i = 0; $i -lt 60; $i++) {
    $health = docker inspect --format="{{.State.Health.Status}}" matlager-mysql 2>$null
    if ($health -eq "healthy") {
        $mysqlReady = $true
        break
    }
    Start-Sleep -Seconds 2
}

if (-not $mysqlReady) {
    docker logs matlager-mysql
    throw "MySQL did not become healthy in time."
}

Write-Host "Verifying MySQL login..."
docker exec matlager-mysql mysql -h 127.0.0.1 -uroot -proot -e "SELECT 1;" | Out-Null
if ($LASTEXITCODE -ne 0) {
    docker logs matlager-mysql
    throw "Could not authenticate to MySQL as root."
}

Write-Host "Recreating database..."
docker exec matlager-mysql mysql -h 127.0.0.1 -uroot -proot -e "DROP DATABASE IF EXISTS matlager_db; CREATE DATABASE matlager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to recreate database."
}

$files = @(
    "schema.sql",
    "Varekategori-seed.sql",
    "Varetyper-seed.sql",
    "Maaleenheter-seed.sql",
    "Varer-seed.sql",
    "Butikker-seed.sql",
    "Butikkpriser-seed.sql",
    "Brukere-seed.sql",
    "Husholdning-seed.sql",
    "Medlemmer-seed.sql",
    "Plassering-seed.sql",
    "Husholdningsinnstillinger-seed.sql",
    "Varelager-seed.sql",
    "Handleliste-seed.sql",
    "Forbruk-seed.sql",
    "Oppskrifter-seed.sql",
    "Ingredienser-seed.sql",
    "Skjuloppskrift-seed.sql",
    "Skjulvare-seed.sql"
)

Write-Host "Copying SQL files into container..."
foreach ($file in $files) {
    docker cp ".\database\$file" "matlager-mysql:/tmp/$file"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy $file into container."
    }
}

Write-Host "Importing SQL files..."
foreach ($file in $files) {
    Write-Host "Importing $file ..."
    docker exec matlager-mysql sh -c "mysql --default-character-set=utf8mb4 -h 127.0.0.1 -uroot -proot matlager_db < /tmp/$file"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed importing $file"
    }
}

Write-Host "Database import completed."