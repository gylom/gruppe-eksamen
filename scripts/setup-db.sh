#!/usr/bin/env bash
set -e

echo "Starting MySQL container with docker compose..."
docker compose up -d

echo "Waiting for container to exist..."
for i in {1..30}; do
  if docker ps -q -f "name=matlager-mysql" | grep -q .; then
    break
  fi
  sleep 2
done

echo "Waiting for MySQL container healthcheck to become healthy..."
for i in {1..60}; do
  health=$(docker inspect --format='{{.State.Health.Status}}' matlager-mysql 2>/dev/null || true)
  if [ "$health" = "healthy" ]; then
    break
  fi
  sleep 2
done

if [ "$(docker inspect --format='{{.State.Health.Status}}' matlager-mysql 2>/dev/null || true)" != "healthy" ]; then
  docker logs matlager-mysql
  echo "MySQL did not become healthy in time."
  exit 1
fi

echo "Verifying MySQL login..."
docker exec matlager-mysql mysql -h 127.0.0.1 -uroot -proot -e "SELECT 1;" >/dev/null

echo "Recreating database..."
docker exec matlager-mysql mysql -h 127.0.0.1 -uroot -proot -e "DROP DATABASE IF EXISTS matlager_db; CREATE DATABASE matlager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

files=(
  schema.sql
  Oppskriftskategorier-seed.sql
  Varekategori-seed.sql
  Varetyper-seed.sql
  Maaleenheter-seed.sql
  Varer-seed.sql
  Butikker-seed.sql
  Butikkpriser-seed.sql
  Brukere-seed.sql
  Husholdning-seed.sql
  Medlemmer-seed.sql
  Plassering-seed.sql
  Husholdningsinnstillinger-seed.sql
  Varelager-seed.sql
  Handleliste-seed.sql
  Forbruk-seed.sql
  Oppskrifter-seed.sql
  Ingredienser-seed.sql
  Skjuloppskrift-seed.sql
  Skjulvare-seed.sql
)

echo "Copying SQL files into container..."
for file in "${files[@]}"; do
  docker cp "./database/$file" "matlager-mysql:/tmp/$file"
done

echo "Importing SQL files..."
for file in "${files[@]}"; do
  echo "Importing $file ..."
  docker exec matlager-mysql sh -c "mysql --default-character-set=utf8mb4 -h 127.0.0.1 -uroot -proot matlager_db < /tmp/$file"
done

echo "Database import completed."