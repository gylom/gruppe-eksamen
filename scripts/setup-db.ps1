$ErrorActionPreference = "Stop"

Write-Host "Starting MySQL with docker compose..."
docker compose up -d

Write-Host "Waiting for MySQL to become ready..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        docker exec matlager-mysql mysqladmin ping -h localhost -proot | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    throw "MySQL did not become ready in time."
}

Write-Host "Recreating database..."
docker exec matlager-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS matlager_db; CREATE DATABASE matlager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

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
}

Write-Host "Importing SQL files..."
foreach ($file in $files) {
    Write-Host "Importing $file ..."
    docker exec matlager-mysql sh -c "mysql --default-character-set=utf8mb4 -uroot -proot matlager_db < /tmp/$file"
}

Write-Host "Database import completed."
Write-Host "You can now run backend and frontend."