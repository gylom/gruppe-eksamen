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

echo "Waiting for MySQL to accept connections..."
for i in {1..40}; do
  if docker exec matlager-mysql mysqladmin ping -h localhost -proot >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Recreating database..."
docker exec matlager-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS matlager_db; CREATE DATABASE matlager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

files=(
  schema.sql
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
  docker exec matlager-mysql sh -c "mysql --default-character-set=utf8mb4 -uroot -proot matlager_db < /tmp/$file"
done

echo "Database import completed."