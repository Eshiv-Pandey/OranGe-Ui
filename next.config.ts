import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";

// Keep downloadable source traces scoped to public library files.
const downloadableSource = ["./components/ui/**/*", "./lib/avatar/**/*", "./lib/utils.ts", "./styles/**/*", "./public/fonts/**/*", "./public/audio/orangeui/**/*", "./LICENSE", "./THIRD_PARTY_NOTICES.md"];
// Turbopack can conservatively trace the project around dynamic fs paths.
// Enumerate only shallow directory entries at config time, then exclude exact
// non-public paths. Runtime chunks and installed packages remain untouched.
const traceScopes: Record<string, readonly string[]> = {
  "": ["node_modules", ".next", "components", "lib", "styles", "public", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json"],
  components: ["ui"],
  lib: ["avatar", "utils.ts"],
  public: ["fonts", "audio"],
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
  poweredByHeader: false,
  outputFileTracingIncludes: { "/api/components/*": downloadableSource, "/r/*": downloadableSource },
  outputFileTracingExcludes: { "/api/components/*": privateFiles, "/r/*": privateFiles },
};
export default config;
