import type { NextConfig } from "next";

const config: NextConfig = { poweredByHeader: false, outputFileTracingIncludes: { "/api/components/*": ["./components/ui/**/*", "./styles/**/*", "./public/fonts/**/*", "./LICENSE"] } };
export default config;
