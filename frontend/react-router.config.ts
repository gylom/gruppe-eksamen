import type { Config } from "@react-router/dev/config"

export default {
  // SPA / static mode — backend (.NET) serves the SPA shell from wwwroot
  // and falls back to index.html for unmatched non-API routes.
  ssr: false,
} satisfies Config
