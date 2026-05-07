export const packageName = "create-electrobun-stack";

export const getPackageVersion = async (): Promise<string> => {
  const manifest = (await Bun.file(
    new URL("../package.json", import.meta.url),
  ).json()) as { version?: unknown };

  return typeof manifest.version === "string" ? manifest.version : "0.0.0";
};
