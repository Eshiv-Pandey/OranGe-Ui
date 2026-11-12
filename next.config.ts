import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";

// Keep downloadable source traces scoped to public library files.
const downloadableSource = ["./components/ui/**/*", "./lib/avatar/**/*", "./lib/utils.ts", "./styles/**/*", "./public/portfolio/**/*", "./public/art/footer/**/*", "./public/art/sections/**/*", "./public/fonts/**/*", "./public/audio/orangeui/**/*", "./public/photos/keepsakes/**/*", "./LICENSE", "./THIRD_PARTY_NOTICES.md"];
// Turbopack can conservatively trace the project around dynamic fs paths.
// Enumerate only shallow directory entries at config time, then exclude exact
// non-public paths. Runtime chunks and installed packages remain untouched.
const traceScopes: Record<string, readonly string[]> = {
  "": ["node_modules", ".next", "components", "lib", "styles", "public", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json"],
  components: ["ui"],
  lib: ["avatar", "utils.ts"],
  public: ["fonts", "audio", "photos", "portfolio", "art"],
  "public/art": ["footer", "sections"],
  "public/photos": ["keepsakes"],
};
const nonPublicSources = Object.entries(traceScopes).flatMap(([folder, retained]) =>
  readdirSync(path.join(__dirname, folder)).filter((name) => !retained.includes(name)).flatMap((name) => {
    const segment = name.replace(/[[\]{}()!+@]/g, (character) => `[${character}]`);
    const target = `./${folder ? `${folder}/` : ""}${segment}`;
    return [target, `${target}/**/*`];
  }),
);
const privateFiles = ["./AGENTS.md", "./USER_INSTRUCTIONS.md", "./CONTRIBUTION_RULES.md", "./.env*", "./.git/**/*", "./out/**/*", "./references/**/*", "./*.tsbuildinfo", "./next-env.d.ts", ...nonPublicSources];
const config: NextConfig = {
  // Opt into fewer build workers on memory-constrained development machines.
  ...(process.env.ORANGEUI_BUILD_WORKERS ? { experimental: { cpus: Math.max(1, Number(process.env.ORANGEUI_BUILD_WORKERS) || 2) } } : {}),
  poweredByHeader: false,
  redirects: async () => [
    { source: "/blocks/auth", destination: "/blocks/category/auth", permanent: true },
    { source: "/components/neon-sign-404", destination: "/blocks/neon-sign-404", permanent: true },
    { source: "/components/chai-break-404", destination: "/blocks/chai-break-404", permanent: true },
    { source: "/components/pavilion-footer", destination: "/blocks/pavilion-footer", permanent: true },
    { source: "/components/live-orb", destination: "/components/emberling", permanent: true },
    { source: "/components/shader-canvas", destination: "/components/grain-gradient", permanent: true },
    { source: "/components/livery-editor", destination: "/components/open-wheel-car", permanent: true },
    { source: "/components/helmet-editor", destination: "/components/helmet", permanent: true },
  ],
  outputFileTracingIncludes: { "/api/components/*": downloadableSource, "/api/blocks/*": downloadableSource, "/r/*": downloadableSource },
  outputFileTracingExcludes: { "/api/components/*": privateFiles, "/api/blocks/*": privateFiles, "/r/*": privateFiles },
};
export default config;
