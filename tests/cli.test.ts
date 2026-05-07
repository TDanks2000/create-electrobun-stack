import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../src/cli";
import type { CesManifest } from "../src/manifest";
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

const readGeneratedManifest = async (
  targetDirectory: string,
): Promise<CesManifest> =>
  JSON.parse(await readGenerated(targetDirectory, "ces.json")) as CesManifest;

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
      "--testing",
      "none",
      "--app-menu",
      "none",
      "--navigation=none",
      "--window-style",
      "hidden-inset",
      "--build-env=stable",
      "--build-targets",
      "all",
      "--package-manager",
      "pnpm",
      "--auth",
      "app-lock",
      "--addons",
      "turborepo",
      "--db-setup",
      "seed",
      "--settings",
      "json",
    ]);

    expect(options.projectName).toBe("sample-app");
    expect(options.install).toBe(false);
    expect(options.git).toBe(true);
    expect(options.stack.styling).toBe("css");
    expect(options.stack.examples).toBe("none");
    expect(options.stack.database).toBe("sqlite");
    expect(options.stack.orm).toBe("drizzle");
    expect(options.stack.testing).toBe("none");
    expect(options.stack.appMenu).toBe("none");
    expect(options.stack.navigation).toBe("none");
    expect(options.stack.windowStyle).toBe("hidden-inset");
    expect(options.stack.buildEnv).toBe("stable");
    expect(options.stack.buildTargets).toBe("all");
    expect(options.stack.packageManager).toBe("pnpm");
    expect(options.stack.auth).toBe("app-lock");
    expect(options.stack.addons).toBe("turborepo");
    expect(options.stack.dbSetup).toBe("seed");
    expect(options.stack.settings).toBe("json");
  });

  test("omits default RPC example when API is disabled", () => {
    const options = parseArgs(["sample-app", "--api", "none"]);

    expect(options.stack.api).toBe("none");
    expect(options.stack.examples).toBe("none");
  });

  test("rejects unsupported stack combinations", () => {
    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        database: "none",
        orm: "drizzle",
      }),
    ).toThrow("Drizzle requires SQLite");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        database: "none",
        dbSetup: "seed",
      }),
    ).toThrow("Seed data requires SQLite");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        api: "none",
        examples: "rpc",
      }),
    ).toThrow("RPC example requires");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        styling: "css",
        ui: "shadcn",
      }),
    ).toThrow("shadcn/ui requires Tailwind CSS");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        api: "none",
        examples: "none",
        settings: "json",
      }),
    ).toThrow("Settings storage requires");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        database: "none",
        settings: "database",
      }),
    ).toThrow("Database-backed settings require SQLite");
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

  test("--dry-run reports the selected package manager", async () => {
    const root = await makeTempRoot();
    const result = await runCliProcess([
      "sample-app",
      "--dry-run",
      "--yes",
      "--cwd",
      root,
      "--package-manager",
      "pnpm",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Package manager: pnpm");
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
    const manifestText = await readGenerated(target, "ces.json");
    const manifest = await readGeneratedManifest(target);

    expect(route).toContain("rpc.request.greet");
    expect(route).toContain("rpc.send.logToBun");
    expect(readme).toContain("## RPC Example");
    expect(manifestText).toContain('"frontend": ["react"]');
    expect(manifestText).toContain('"addons": [');
    expect(manifest.$schema).toContain("create-electrobun-stack@");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(Date.parse(manifest.createdAt)).not.toBeNaN();
    expect(manifest.reproducibleCommand).toContain(
      "bunx create-electrobun-stack@",
    );
    expect(manifest.reproducibleCommand).toContain("--testing bun");
    expect(manifest.reproducibleCommand).toContain("--navigation local-only");
    expect(manifest.reproducibleCommand).toContain("--window-style native");
    expect(manifest.reproducibleCommand).toContain("--settings none");
    expect(manifest.reproducibleCommand).toContain("--no-install");
    expect(manifest.projectName).toBe("sample-app");
    expect(manifest.packageName).toBe("sample-app");
    expect(manifest.appIdentifier).toBe("dev.electrobun.sampleapp");
    expect(manifest.template).toBe("minimal");
    expect(manifest.frontend).toEqual(["react"]);
    expect(manifest.addons).toEqual([
      "biome",
      "electrobun",
      "bun-test",
      "app-menu",
      "navigation-guard",
    ]);
    expect(manifest.examples).toEqual(["rpc"]);
    expect(manifest.testing).toBe("bun");
    expect(manifest.appMenu).toBe("edit");
    expect(manifest.navigation).toBe("local-only");
    expect(manifest.windowStyle).toBe("native");
    expect(manifest.buildEnv).toBe("dev");
    expect(manifest.buildTargets).toBe("current");
    expect(manifest.settings).toBe("none");
    expect(manifest.features).toMatchObject({
      databaseSettings: false,
      editMenu: true,
      electrobun: true,
      electrobunRpc: true,
      hiddenInsetTitlebar: false,
      jsonSettings: false,
      localNavigationGuard: true,
      react: true,
      rpcExample: true,
      bunTest: true,
      settingsStore: false,
      shadcn: false,
      sqlite: false,
      tailwindcss: true,
    });
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

  test("omits Bun test scaffold when testing is disabled", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      testing: "none",
    });
    const packageJson = await readGenerated(target, "package.json");
    const tsconfig = await readGenerated(target, "tsconfig.json");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).not.toContain('"test": "bun test"');
    expect(tsconfig).not.toContain('"tests"');
    expect(
      await Bun.file(join(target, "tests/manifest.test.ts")).exists(),
    ).toBe(false);
    expect(manifest.testing).toBe("none");
    expect(manifest.features.bunTest).toBe(false);
    expect(manifest.addons).toEqual([
      "biome",
      "electrobun",
      "app-menu",
      "navigation-guard",
    ]);
  });

  test("renders Bun test scaffold by default", async () => {
    const target = await renderMinimal({ ...defaultStackOptions });
    const packageJson = await readGenerated(target, "package.json");
    const tsconfig = await readGenerated(target, "tsconfig.json");
    const testFile = await readGenerated(target, "tests/manifest.test.ts");

    expect(packageJson).toContain('"packageManager": "bun@1.3.0"');
    expect(packageJson).toContain('"test": "bun test"');
    expect(tsconfig).toContain('"tests"');
    expect(testFile).toContain("generated project manifest");
  });

  test("renders selected package manager metadata and commands", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      packageManager: "pnpm",
    });
    const packageJson = await readGenerated(target, "package.json");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"packageManager": "pnpm@9.15.4"');
    expect(readme).toContain("pnpm install");
    expect(readme).toContain("pnpm dev");
    expect(readme).toContain("pnpm typecheck");
    expect(manifest.packageManager).toBe("pnpm");
  });

  test("renders Electrobun desktop options", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      buildEnv: "stable",
      buildTargets: "all",
      windowStyle: "hidden-inset",
    });
    const packageJson = await readGenerated(target, "package.json");
    const index = await readGenerated(target, "src/bun/index.ts");
    const window = await readGenerated(target, "src/bun/window.ts");
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const appStyles = await readGenerated(
      target,
      "src/views/main/styles/app.css",
    );
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain(
      '"build": "vite build && electrobun build --env=stable --targets=all"',
    );
    expect(index).toContain("setupApplicationMenu");
    expect(await Bun.file(join(target, "src/bun/menu.ts")).exists()).toBe(true);
    expect(window).toContain('titleBarStyle: "hiddenInset"');
    expect(window).toContain('window.webview.on("will-navigate"');
    expect(window).toContain("const getNavigationUrl");
    expect(window).toContain("typeof data.detail");
    expect(window).toContain("event.response = { allow: false }");
    expect(window).not.toContain("navigationEvent.data.url");
    expect(route).toContain("window-drag-bar");
    expect(appStyles).toContain(".window-drag-bar");
    expect(manifest.buildEnv).toBe("stable");
    expect(manifest.buildTargets).toBe("all");
    expect(manifest.windowStyle).toBe("hidden-inset");
    expect(manifest.features).toMatchObject({
      editMenu: true,
      hiddenInsetTitlebar: true,
      localNavigationGuard: true,
    });
  });

  test("omits optional Electrobun desktop integrations", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      appMenu: "none",
      navigation: "none",
    });
    const index = await readGenerated(target, "src/bun/index.ts");
    const window = await readGenerated(target, "src/bun/window.ts");
    const manifest = await readGeneratedManifest(target);

    expect(index).not.toContain("setupApplicationMenu");
    expect(await Bun.file(join(target, "src/bun/menu.ts")).exists()).toBe(
      false,
    );
    expect(window).not.toContain("will-navigate");
    expect(manifest.addons).not.toContain("app-menu");
    expect(manifest.addons).not.toContain("navigation-guard");
    expect(manifest.features).toMatchObject({
      editMenu: false,
      localNavigationGuard: false,
    });
  });

  test("renders static API mode without RPC wiring", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      api: "none",
      examples: "none",
    });
    const window = await readGenerated(target, "src/bun/window.ts");
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const manifest = await readGeneratedManifest(target);

    expect(window).not.toContain("mainViewRPC");
    expect(window).not.toContain("rpc:");
    expect(route).not.toContain("../lib/rpc");
    expect(route).toContain("Renderer ready");
    expect(manifest.api).toBe("none");
    expect(manifest.features.electrobunRpc).toBe(false);
  });

  test("renders app lock auth option", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      auth: "app-lock",
    });
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const styles = await readGenerated(target, "src/views/main/styles/app.css");
    const manifest = await readGeneratedManifest(target);

    expect(route).toContain("Local app lock");
    expect(route).toContain("setIsUnlocked");
    expect(styles).toContain(".auth-form");
    expect(manifest.auth).toBe("app-lock");
    expect(manifest.features.appLock).toBe(true);
  });

  test("renders seed data setup only when requested", async () => {
    const unseeded = await renderMinimal({
      ...defaultStackOptions,
      database: "sqlite",
    });
    const seeded = await renderMinimal({
      ...defaultStackOptions,
      database: "sqlite",
      dbSetup: "seed",
    });
    const unseededClient = await readGenerated(
      unseeded,
      "src/bun/db/client.ts",
    );
    const seededClient = await readGenerated(seeded, "src/bun/db/client.ts");
    const manifest = await readGeneratedManifest(seeded);

    expect(unseededClient).not.toContain("SQLite is ready.");
    expect(seededClient).toContain("SQLite is ready.");
    expect(manifest.dbSetup).toBe("seed");
  });

  test("renders Turborepo addon", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      addons: "turborepo",
    });
    const packageJson = await readGenerated(target, "package.json");
    const turboJson = await readGenerated(target, "turbo.json");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"turbo"');
    expect(packageJson).toContain('"packageManager": "bun@1.3.0"');
    expect(packageJson).toContain('"check": "turbo run typecheck lint test"');
    await expect(readGenerated(target, "README.md")).resolves.toContain(
      "bun run check",
    );
    expect(turboJson).toContain('"tasks"');
    expect(manifest.addons).toContain("turborepo");
    expect(manifest.features.turborepo).toBe(true);
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
      ui: "shadcn",
    });
    const packageJson = await readGenerated(target, "package.json");
    const dbClient = await readGenerated(target, "src/bun/db/client.ts");
    const manifest = await readGeneratedManifest(target);

    expect(await Bun.file(join(target, "drizzle.config.ts")).exists()).toBe(
      true,
    );
    expect(packageJson).toContain('"drizzle-orm"');
    expect(dbClient).toContain("drizzle");
    expect(manifest.database).toBe("sqlite");
    expect(manifest.orm).toBe("drizzle");
    expect(manifest.ui).toBe("shadcn");
    expect(manifest.features).toMatchObject({
      drizzle: true,
      shadcn: true,
      sqlite: true,
    });
  });
});
