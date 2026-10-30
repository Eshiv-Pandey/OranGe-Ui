import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["components/ui/creative-decals.tsx", "components/ui/retro-player.tsx", "components/ui/retro-camera.tsx", "components/ui/island-player.tsx", "components/ui/glass-player.tsx", "components/ui/neon-pill-player.tsx", "components/ui/tilt-stamp-3d.tsx", "components/ui/frosted-glass.tsx"], rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
