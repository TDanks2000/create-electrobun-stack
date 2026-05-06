import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../src/cli";
import { defaultStackOptions, validateStackOptions } from "../src/options";
import { scaffoldProject } from "../src/scaffold";

const repoRoot = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const tempRoots: Array<string> = [];

const makeTempRoot = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "create-electrobun-stack-"));
  tempRoots.push(root);
  return root;
};

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0)
      .map((root) => rm(root, { force: true, recursive: true })),
  );
});

const runCliProcess = async (
  args: Array<string>,
): Promise<{ exitCode: number; stderr: string; stdout: string }> => {
  const process = Bun.spawn(["bun", "run", "src/index.ts", ...args], {
    cwd: repoRoot,
    env: { ...Bun.env, NO_COLOR: "1" },
    stderr: "pipe",
    stdin: "ignore",
    stdout: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);

  return { exitCode, stderr, stdout };
};

const renderMinimal = async (
  stack: typeof defaultStackOptions,
): Promise<string> => {
  const root = await makeTempRoot();
  const targetDirectory = join(root, "sample-app");

  validateStackOptions(stack);

  await scaffoldProject({
    appIdentifier: "dev.electrobun.sampleapp",
    packageName: "sample-app",
    projectName: "sample-app",
    stack,
    targetDirectory,
    template: "minimal",
  });

  return targetDirectory;
};

const readGenerated = (
  targetDirectory: string,
  path: string,
): Promise<string> => Bun.file(join(targetDirectory, path)).text();

describe("parseArgs", () => {
  test("parses stack flags and operational flags", () => {
    const options = parseArgs([
      "sample-app",
      "--no-install",
      "--git",
      "--styling",
      "css",
      "--examples=none",
      "--database",
      "sqlite",
      "--orm=drizzle",
    ]);

    expect(options.projectName).toBe("sample-app");
    expect(options.install).toBe(false);
    expect(options.git).toBe(true);
    expect(options.stack.styling).toBe("css");
    expect(options.stack.examples).toBe("none");
    expect(options.stack.database).toBe("sqlite");
    expect(options.stack.orm).toBe("drizzle");
  });

  test("rejects unsupported stack combinations", () => {
    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        database: "none",
        orm: "drizzle",
      }),
    ).toThrow("Drizzle requires SQLite");
  });
});

describe("CLI process", () => {
  test("--version matches package.json", async () => {
    const manifest = (await Bun.file(
      join(repoRoot, "package.json"),
    ).json()) as {
      version: string;
    };
    const result = await runCliProcess(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(manifest.version);
    expect(result.stderr).toBe("");
  });

  test("--dry-run does not create the target directory", async () => {
    const root = await makeTempRoot();
    const result = await runCliProcess([
      "sample-app",
      "--dry-run",
      "--yes",
      "--cwd",
      root,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No files were written.");
    expect(await Bun.file(join(root, "sample-app")).exists()).toBe(false);
  });
});

describe("generated minimal template", () => {
  test("renders the default RPC example", async () => {
    const target = await renderMinimal({ ...defaultStackOptions });
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const readme = await readGenerated(target, "README.md");

    expect(route).toContain("rpc.request.greet");
    expect(route).toContain("rpc.send.logToBun");
    expect(readme).toContain("## RPC Example");
  });

  test("omits demo RPC calls when examples are disabled", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      examples: "none",
    });
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const readme = await readGenerated(target, "README.md");

    expect(route).not.toContain("rpc.request.greet");
    expect(route).not.toContain("rpc.send.logToBun");
    expect(router).not.toContain("greet");
    expect(router).not.toContain("logToBun");
    expect(readme).not.toContain("## RPC Example");
  });

  test("renders plain CSS without Tailwind dependencies", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      styling: "css",
    });
    const packageJson = await readGenerated(target, "package.json");
    const styles = await readGenerated(
      target,
      "src/views/main/styles/globals.css",
    );

    expect(packageJson).not.toContain("tailwindcss");
    expect(styles).toContain(":root");
    expect(styles).not.toContain('@import "tailwindcss"');
  });

  test("renders Tailwind and shadcn config", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      ui: "shadcn",
    });
    const packageJson = await readGenerated(target, "package.json");
    const styles = await readGenerated(
      target,
      "src/views/main/styles/globals.css",
    );

    expect(await Bun.file(join(target, "components.json")).exists()).toBe(true);
    expect(packageJson).toContain('"shadcn"');
    expect(styles).toContain('@import "shadcn/tailwind.css"');
  });

  test("renders SQLite with Drizzle overlay", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      database: "sqlite",
      orm: "drizzle",
    });
    const packageJson = await readGenerated(target, "package.json");
    const dbClient = await readGenerated(target, "src/bun/db/client.ts");

    expect(await Bun.file(join(target, "drizzle.config.ts")).exists()).toBe(
      true,
    );
    expect(packageJson).toContain('"drizzle-orm"');
    expect(dbClient).toContain("drizzle");
  });
});
