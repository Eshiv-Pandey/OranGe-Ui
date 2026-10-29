// @vitest-environment node
import { describe, expect, it } from "vitest";
import { externalPackage, relocateSource, sourceAlias, sourceImports } from "../lib/source-imports";

describe("literal source imports", () => {
  it("reads actual imports, exports and dynamic references without following comment or string examples", () => {
    const source = `// import "../../private";
/* export { secret } from "@/private"; */
const text = 'import "../../not-a-dependency";';
const snippet = \`import "@/private";\`;
import React from "react";
import type { CSSProperties } from "react";
import "./control.css";
export { cn } from "@/lib/utils";
const helper = import("@/components/ui/helper");
const legacy = require("some-package/subpath");
`;
    expect(sourceImports(source, "control.tsx").map((item) => item.value)).toEqual(["react", "react", "./control.css", "@/lib/utils", "@/components/ui/helper", "some-package/subpath"]);
  });
  it("reads quoted CSS import forms without mistaking font URLs for package dependencies", () => {
    const css = '@import "./tokens.css"; @import url("./appearance.css") screen; @import url(./optional.css); @font-face { src: url("/fonts/geist-latin.woff2") }';
    expect(sourceImports(css, "theme.css").map((item) => item.value)).toEqual(["./tokens.css", "./appearance.css", "./optional.css"]);
  });
  it("excludes only the exact React package roots", () => {
    for (const name of ["react", "react/jsx-runtime", "react-dom", "react-dom/client"]) expect(externalPackage(name)).toBeUndefined();
    expect(externalPackage("react-markdown")).toBe("react-markdown"); expect(externalPackage("react-remove-scroll/dist")).toBe("react-remove-scroll");
    expect(externalPackage("remark-gfm")).toBe("remark-gfm"); expect(externalPackage("@radix-ui/react-slot")).toBe("@radix-ui/react-slot");
    expect(externalPackage("three/addons/controls/OrbitControls.js")).toBe("three");
    expect(() => externalPackage("node:fs")).toThrow("Unsupported source import");
  });
  it("allows only the known public project aliases", () => {
    expect(sourceAlias("@/lib/utils")).toBe("lib/utils"); expect(sourceAlias("@/components/ui/button")).toBe("components/ui/button");
    for (const name of ["@/lib/private", "@/lib/utils/private", "@/app/page", "@/USER_INSTRUCTIONS.md"]) expect(() => sourceAlias(name)).toThrow("Source dependency outside component folders");
  });
  it("rebases only import literals when an example moves under examples/", () => {
    const example = 'import { Button } from "./components/ui/button";\nconst text = "./components/ui/button";\nimport "./styles/base.css";';
    expect(relocateSource(example, "Example.tsx", "examples/button.tsx")).toBe('import { Button } from "../components/ui/button";\nconst text = "./components/ui/button";\nimport "../styles/base.css";');
  });
});
