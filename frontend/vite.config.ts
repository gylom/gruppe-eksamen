import path from "node:path"
import { fileURLToPath } from "node:url"

import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const appRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    alias: {
      "~": path.resolve(appRoot, "app"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: "/register",
    proxy: {
      "/api": {
        target: "http://localhost:5188",
        changeOrigin: false,
      },
    },
  },
})