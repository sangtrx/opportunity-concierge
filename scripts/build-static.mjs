import { rename, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "app", "api");
const parkedApiDir = path.join(root, ".static-export-api");

await rm(parkedApiDir, { recursive: true, force: true });
await rename(apiDir, parkedApiDir);

try {
  const result = spawnSync("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      CONVEX_STATIC_EXPORT: "1",
      NEXT_PUBLIC_CONVEX_URL:
        process.env.VITE_CONVEX_URL ??
        process.env.NEXT_PUBLIC_CONVEX_URL ??
        "",
    },
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rename(parkedApiDir, apiDir);
}
