import type { NextConfig } from "next";

const config: NextConfig = { poweredByHeader: false, outputFileTracingIncludes: { "/api/components/*": ["./components/ui/**/*", "./lib/avatar/**/*", "./styles/**/*", "./public/fonts/**/*", "./LICENSE"] } };
export default config;
