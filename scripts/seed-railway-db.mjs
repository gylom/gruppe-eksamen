// Seeds the Railway MySQL database. Run with:
//   railway run --service MySQL node scripts/seed-railway-db.mjs
// Requires `mysql2` (install once: npm install --no-save mysql2)

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, "..", "database");

const files = [
  "schema.sql",
  "Oppskriftskategorier-seed.sql",
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
  "Skjulvare-seed.sql",
];

// Prefer public URL when running from a local machine; fall back to discrete vars.
const { MYSQL_PUBLIC_URL, MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE } = process.env;

let connectionConfig;
if (MYSQL_PUBLIC_URL) {
  const url = new URL(MYSQL_PUBLIC_URL);
  connectionConfig = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
  };
} else if (MYSQLHOST && MYSQLUSER && MYSQLDATABASE) {
  connectionConfig = {
    host: MYSQLHOST,
    port: Number(MYSQLPORT) || 3306,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
  };
} else {
  console.error("Missing MYSQL env vars. Run via: railway run --service MySQL node scripts/seed-railway-db.mjs");
  process.exit(1);
}

console.log(`Connecting to ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database} as ${connectionConfig.user}`);

const conn = await mysql.createConnection({
  ...connectionConfig,
  multipleStatements: true,
  charset: "utf8mb4",
});

for (const file of files) {
  const path = join(dbDir, file);
  console.log(`Applying ${file}`);
  const sql = await readFile(path, "utf8");
  await conn.query(sql);
}

await conn.end();
console.log("Done.");
