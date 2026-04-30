import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const src = join(root, "frontend", "build", "client")
const dest = join(root, "backend", "wwwroot")

if (!existsSync(src)) {
  console.error(`[copy-frontend-to-wwwroot] missing source: ${src}`)
  console.error(`Run "npm run build --prefix frontend" first.`)
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true })
writeFileSync(join(dest, ".gitkeep"), "")

console.log(`[copy-frontend-to-wwwroot] copied ${src} → ${dest}`)
