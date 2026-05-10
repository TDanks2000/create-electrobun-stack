import { readFile } from "node:fs/promises";

export const packageName = "create-electrobun-stack";

export const getPackageVersion = async (): Promise<string> => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version?: unknown };

  return typeof manifest.version === "string" ? manifest.version : "0.0.0";
};
