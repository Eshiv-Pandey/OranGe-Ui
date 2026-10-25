import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const failures = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) failures.push(...await scan(path));
    else if (/\.(tsx?|jsx?|css|md|mdx|json|svg)$/.test(path)) {
      const lines = (await readFile(path, "utf8")).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (/[\u2013\u2014]/.test(line)) failures.push(`${path}:${index + 1}`);
      });
    }
  }
  return failures;
}

const failures = (await Promise.all(["app", "components", "stories"].map(scan))).flat();
if (failures.length) {
  console.error("Copy contains forbidden dash characters:\n" + failures.join("\n"));
  process.exit(1);
}
console.log("Copy check passed.");
