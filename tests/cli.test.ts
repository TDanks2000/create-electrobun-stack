import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFinalScreen, parseArgs } from "../src/cli";
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

const runGeneratedBiomeCheck = async (
  targetDirectory: string,
): Promise<{ exitCode: number; stderr: string; stdout: string }> => {
  const process = Bun.spawn(
    [join(repoRoot, "node_modules", ".bin", "biome"), "check", "."],
    {
      cwd: targetDirectory,
      env: { ...Bun.env, NO_COLOR: "1" },
      stderr: "pipe",
      stdin: "ignore",
      stdout: "pipe",
    },
  );
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
      "--router",
      "react-router",
      "--query",
      "tanstack-query",
      "--examples=none",
      "--database",
      "sqlite",
      "--orm=drizzle",
      "--testing",
      "none",
      "--app-menu",
      "none",
      "--navigation=none",
      "--native-utils",
      "file-dialogs",
      "--window-style",
      "hidden-inset",
      "--build-env=stable",
      "--build-targets",
      "all",
      "--package-manager",
      "pnpm",
      "--packaging",
      "installers",
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
    expect(options.stack.router).toBe("react-router");
    expect(options.stack.query).toBe("tanstack-query");
    expect(options.stack.examples).toBe("none");
    expect(options.stack.database).toBe("sqlite");
    expect(options.stack.orm).toBe("drizzle");
    expect(options.stack.testing).toBe("none");
    expect(options.stack.appMenu).toBe("none");
    expect(options.stack.navigation).toBe("none");
    expect(options.stack.nativeUtils).toBe("file-dialogs");
    expect(options.stack.windowStyle).toBe("hidden-inset");
    expect(options.stack.buildEnv).toBe("stable");
    expect(options.stack.buildTargets).toBe("all");
    expect(options.stack.packageManager).toBe("pnpm");
    expect(options.stack.packaging).toBe("installers");
    expect(options.stack.auth).toBe("app-lock");
    expect(options.stack.addons).toBe("turborepo");
    expect(options.stack.dbSetup).toBe("seed");
    expect(options.stack.settings).toBe("json");
  });

  test("parses add as a subcommand for existing stacks", () => {
    const options = parseArgs([
      "add",
      "--cwd",
      "sample-app",
      "--database",
      "sqlite",
      "--no-install",
    ]);

    expect(options.command).toBe("add");
    expect(options.projectName).toBeNull();
    expect(options.stack.database).toBe("sqlite");
    expect(options.stackFlags.has("database")).toBe(true);
    expect(options.install).toBe(false);
  });

  test("omits default RPC example when API is disabled", () => {
    const options = parseArgs(["sample-app", "--api", "none"]);

    expect(options.stack.api).toBe("none");
    expect(options.stack.examples).toBe("none");
  });

  test("uses direct rendering defaults for Preact", () => {
    const options = parseArgs(["sample-app", "--frontend", "preact"]);

    expect(options.stack.frontend).toBe("preact");
    expect(options.stack.router).toBe("none");
    expect(options.stack.query).toBe("none");
    expect(options.stack.ui).toBe("none");
  });

  test("uses direct rendering defaults for Svelte frontends", () => {
    const svelte = parseArgs(["sample-app", "--frontend", "svelte"]);
    const sveltekit = parseArgs(["sample-app", "--frontend", "sveltekit"]);

    expect(svelte.stack.frontend).toBe("svelte");
    expect(svelte.stack.router).toBe("none");
    expect(svelte.stack.query).toBe("none");
    expect(svelte.stack.ui).toBe("none");
    expect(sveltekit.stack.frontend).toBe("sveltekit");
    expect(sveltekit.stack.router).toBe("none");
    expect(sveltekit.stack.query).toBe("none");
    expect(sveltekit.stack.ui).toBe("none");
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
    ).toThrow("Seed data requires a generated database");

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
        api: "none",
        examples: "none",
        nativeUtils: "file-dialogs",
      }),
    ).toThrow("Native utility examples require");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        database: "none",
        settings: "database",
      }),
    ).toThrow("Database-backed settings require SQLite");

    expect(() =>
      validateStackOptions({
        ...defaultStackOptions,
        frontend: "preact",
      }),
    ).toThrow("Non-React renderers currently use");
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

  test("--list-templates describes standard and full as V1 aliases", async () => {
    const result = await runCliProcess(["--list-templates"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("minimal   implemented, default");
    expect(result.stdout).toContain(
      "standard  accepted alias for minimal in V1",
    );
    expect(result.stdout).toContain(
      "full      accepted alias for minimal in V1",
    );
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

  test("prints contextual next steps after scaffolding", async () => {
    const root = await makeTempRoot();
    const result = await runCliProcess([
      "sample-app",
      "--yes",
      "--no-install",
      "--cwd",
      root,
      "--package-manager",
      "pnpm",
      "--testing",
      "none",
    ]);
    const projectPath = join(root, "sample-app");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Dependencies: install skipped");
    expect(result.stdout).toContain("Next steps:");
    expect(result.stdout).toContain(`1. cd ${projectPath}`);
    expect(result.stdout).toContain("2. pnpm install");
    expect(result.stdout).toContain("Install dependencies");
    expect(result.stdout).toContain("3. pnpm dev");
    expect(result.stdout).toContain("Run the desktop app in dev mode");
    expect(result.stdout).toContain("Verify:");
    expect(result.stdout).toContain("pnpm typecheck");
    expect(result.stdout).toContain("pnpm lint");
    expect(result.stdout).toContain("pnpm build");
    expect(result.stdout).not.toContain("pnpm test");
    expect(result.stdout).toContain("Generated files:");
    expect(result.stdout).toContain("ces.json");
    expect(result.stdout).toContain("Grow this stack later:");
  });

  test("adds requested features to an existing stack from ces.json", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      testing: "none",
    });
    const originalManifest = await readGeneratedManifest(target);
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--settings",
      "database",
      "--orm",
      "drizzle",
      "--testing",
      "bun",
      "--no-install",
    ]);
    const packageJson = await readGenerated(target, "package.json");
    const types = await readGenerated(target, "src/shared/types.ts");
    const schema = await readGenerated(target, "src/shared/rpc/schema.ts");
    const dbSchema = await readGenerated(target, "src/bun/db/schema.ts");
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const store = await readGenerated(target, "src/bun/settings/store.ts");
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Updated sample-app from ces.json");
    expect(result.stdout).toContain("database: none -> sqlite");
    expect(result.stdout).toContain("orm: none -> drizzle");
    expect(result.stdout).toContain("settings: none -> database");
    expect(result.stdout).toContain("testing: none -> bun");
    expect(result.stdout).toContain("Dependencies: install skipped");
    expect(packageJson).toContain('"test": "bun test"');
    expect(packageJson).toContain('"drizzle-orm"');
    expect(types).toContain("DatabaseStatus");
    expect(types).toContain("SettingsStatus");
    expect(schema).toContain("getDatabaseStatus");
    expect(schema).toContain("updateSetting");
    expect(dbSchema).toContain("appSettings");
    expect(router).toContain("getSettingsStatus");
    expect(store).toContain('storage: "database"');
    expect(
      await Bun.file(join(target, "tests/manifest.test.ts")).exists(),
    ).toBe(true);
    expect(manifest.createdAt).toBe(originalManifest.createdAt);
    expect(manifest.database).toBe("sqlite");
    expect(manifest.orm).toBe("drizzle");
    expect(manifest.settings).toBe("database");
    expect(manifest.testing).toBe("bun");
    expect(manifest.addons).toContain("settings-database");
    expect(manifest.addons).toContain("bun-test");
    expect(manifest.features).toMatchObject({
      databaseSettings: true,
      bunTest: true,
      drizzle: true,
      settingsStore: true,
      sqlite: true,
    });
  });

  test("infers add prerequisites from the existing manifest", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      styling: "css",
      testing: "none",
    });
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--ui",
      "shadcn",
      "--no-install",
    ]);
    const packageJson = await readGenerated(target, "package.json");
    const globals = await readGenerated(
      target,
      "src/views/main/styles/globals.css",
    );
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("styling: css -> tailwindcss");
    expect(result.stdout).toContain("ui: none -> shadcn");
    expect(await Bun.file(join(target, "components.json")).exists()).toBe(true);
    expect(packageJson).toContain('"tailwindcss"');
    expect(packageJson).toContain('"shadcn"');
    expect(globals).toContain('@import "shadcn/tailwind.css"');
    expect(manifest.styling).toBe("tailwindcss");
    expect(manifest.ui).toBe("shadcn");
    expect(manifest.features).toMatchObject({
      shadcn: true,
      tailwindcss: true,
    });
  });

  test("add command can enable JSON database seed data", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      testing: "none",
    });
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--database",
      "json-file",
      "--db-setup",
      "seed",
      "--no-install",
    ]);
    const dbClient = await readGenerated(target, "src/bun/db/client.ts");
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("database: none -> json-file");
    expect(result.stdout).toContain("dbSetup: none -> seed");
    expect(dbClient).toContain("app-db.json");
    expect(manifest.database).toBe("json-file");
    expect(manifest.dbSetup).toBe("seed");
    expect(manifest.features.jsonDatabase).toBe(true);
  });

  test("add command can enable native file dialogs and infer RPC", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      api: "none",
      examples: "none",
      testing: "none",
    });
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--native-utils",
      "file-dialogs",
      "--no-install",
    ]);
    const handlers = await readGenerated(target, "src/bun/rpc/handlers.ts");
    const window = await readGenerated(target, "src/bun/window.ts");
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("api: none -> electrobun-rpc");
    expect(result.stdout).toContain("nativeUtils: none -> file-dialogs");
    expect(handlers).toContain("Utils.openFileDialog");
    expect(window).toContain("rpc: mainViewRPC");
    expect(manifest.api).toBe("electrobun-rpc");
    expect(manifest.nativeUtils).toBe("file-dialogs");
    expect(manifest.features.nativeFileDialogs).toBe(true);
  });

  test("add command can expand file dialogs to the desktop native kit", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      nativeUtils: "file-dialogs",
      testing: "none",
    });
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--native-utils",
      "desktop-kit",
      "--testing",
      "desktop-smoke",
      "--no-install",
    ]);
    const handlers = await readGenerated(target, "src/bun/rpc/handlers.ts");
    const desktopSmoke = await readGenerated(
      target,
      "tests/desktop-smoke.test.ts",
    );
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("nativeUtils: file-dialogs -> desktop-kit");
    expect(result.stdout).toContain("testing: none -> desktop-smoke");
    expect(handlers).toContain("Utils.clipboardWriteText");
    expect(desktopSmoke).toContain("desktop launch smoke");
    expect(manifest.nativeUtils).toBe("desktop-kit");
    expect(manifest.testing).toBe("desktop-smoke");
    expect(manifest.features).toMatchObject({
      desktopSmokeTest: true,
      nativeClipboard: true,
      nativeFileDialogs: true,
    });
  });

  test("add command can enable installer packaging", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      testing: "none",
    });
    const result = await runCliProcess([
      "add",
      "--cwd",
      target,
      "--packaging",
      "installers",
      "--no-install",
    ]);
    const packageJson = await readGenerated(target, "package.json");
    const packagingScript = await readGenerated(
      target,
      "scripts/package-electrobun.ts",
    );
    const manifest = await readGeneratedManifest(target);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("packaging: none -> installers");
    expect(packageJson).toContain('"package:release"');
    expect(packageJson).toContain('"package:linux"');
    expect(packagingScript).toContain('"appimage"');
    expect(packagingScript).toContain("dpkg-deb");
    expect(manifest.packaging).toBe("installers");
    expect(manifest.addons).toContain("installer-packaging");
    expect(manifest.features.installerPackaging).toBe(true);
  });

  test("add command requires ces.json", async () => {
    const root = await makeTempRoot();
    const result = await runCliProcess([
      "add",
      "--cwd",
      root,
      "--database",
      "sqlite",
      "--no-install",
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Could not find ces.json");
  });
});

describe("final screen", () => {
  test("omits install from next steps when dependencies are installed", () => {
    const lines = createFinalScreen({
      gitInitialized: true,
      installAttempted: true,
      installed: true,
      projectName: "sample-app",
      stack: { ...defaultStackOptions },
      targetDirectory: join(repoRoot, "sample-app"),
    });

    expect(lines).toContain("Dependencies: installed");
    expect(lines).toContain("Git: initialized");
    expect(lines).toContain("1. cd sample-app  Open the project directory");
    expect(lines).toContain(
      "2. bun run dev    Run the desktop app in dev mode",
    );
    expect(lines.join("\n")).not.toContain("bun install");
    expect(lines.join("\n")).toContain("bun test");
    expect(lines).toContain("Generated files:");
    expect(lines.join("\n")).toContain("src/views/main/");
    expect(lines).toContain("Grow this stack later:");
    expect(lines.join("\n")).toContain(
      "bunx --bun create-electrobun-stack add --help",
    );
  });

  test("uses Turborepo check wording that matches the testing stack", () => {
    const lines = createFinalScreen({
      gitInitialized: false,
      installAttempted: false,
      installed: false,
      projectName: "sample-app",
      stack: {
        ...defaultStackOptions,
        addons: "turborepo",
        testing: "none",
      },
      targetDirectory: join(repoRoot, "sample-app"),
    });
    const output = lines.join("\n");

    expect(output).toContain("bun run check  Run typecheck and lint");
    expect(output).not.toContain("and tests");
  });

  test("highlights SvelteKit routes and installer packaging helpers", () => {
    const lines = createFinalScreen({
      gitInitialized: false,
      installAttempted: false,
      installed: false,
      projectName: "sample-app",
      stack: {
        ...defaultStackOptions,
        frontend: "sveltekit",
        packaging: "installers",
        router: "none",
      },
      targetDirectory: join(repoRoot, "sample-app"),
    });
    const output = lines.join("\n");

    expect(output).toContain("src/views/main/routes/");
    expect(output).toContain("scripts/package-electrobun.ts");
    expect(output).toContain("bun run package:release");
  });
});

describe("generated minimal template", () => {
  test("records accepted template aliases while rendering the same stable source", async () => {
    const root = await makeTempRoot();
    const stack = { ...defaultStackOptions, testing: "none" };
    const templates = ["minimal", "standard", "full"] as const;

    for (const template of templates) {
      await scaffoldProject({
        appIdentifier: "dev.electrobun.sampleapp",
        packageName: "sample-app",
        projectName: "sample-app",
        stack,
        targetDirectory: join(root, template),
        template,
      });
    }

    const minimalHome = await readGenerated(
      join(root, "minimal"),
      "src/views/main/home.tsx",
    );
    const standardHome = await readGenerated(
      join(root, "standard"),
      "src/views/main/home.tsx",
    );
    const fullHome = await readGenerated(
      join(root, "full"),
      "src/views/main/home.tsx",
    );
    const standardManifest = await readGeneratedManifest(
      join(root, "standard"),
    );
    const fullManifest = await readGeneratedManifest(join(root, "full"));

    expect(standardHome).toBe(minimalHome);
    expect(fullHome).toBe(minimalHome);
    expect(standardManifest.template).toBe("standard");
    expect(standardManifest.reproducibleCommand).toContain(
      "--template standard",
    );
    expect(fullManifest.template).toBe("full");
    expect(fullManifest.reproducibleCommand).toContain("--template full");
  });

  test("renders Biome-clean representative projects", async () => {
    const representativeStacks = [
      { ...defaultStackOptions },
      {
        ...defaultStackOptions,
        addons: "turborepo",
        auth: "app-lock",
        buildEnv: "stable",
        buildTargets: "all",
        database: "sqlite",
        dbSetup: "seed",
        nativeUtils: "desktop-kit",
        orm: "drizzle",
        packaging: "installers",
        query: "tanstack-query",
        router: "react-router",
        settings: "database",
        testing: "desktop-smoke",
        ui: "shadcn",
        windowStyle: "hidden-inset",
      },
      {
        ...defaultStackOptions,
        api: "none",
        appMenu: "none",
        examples: "none",
        navigation: "none",
        router: "none",
        styling: "css",
        testing: "none",
      },
      {
        ...defaultStackOptions,
        database: "json-file",
        dbSetup: "seed",
        frontend: "preact",
        router: "none",
        testing: "desktop-smoke",
      },
      {
        ...defaultStackOptions,
        frontend: "svelte",
        router: "none",
      },
      {
        ...defaultStackOptions,
        frontend: "sveltekit",
        router: "none",
      },
    ] satisfies Array<typeof defaultStackOptions>;

    for (const stack of representativeStacks) {
      const target = await renderMinimal(stack);
      const result = await runGeneratedBiomeCheck(target);

      if (result.exitCode !== 0) {
        throw new Error(
          `Generated Biome check failed for ${target}\n${result.stdout}${result.stderr}`,
        );
      }

      expect(result.exitCode).toBe(0);
    }
  });

  test("renders the default RPC example", async () => {
    const target = await renderMinimal({ ...defaultStackOptions });
    const route = await readGenerated(
      target,
      "src/views/main/routes/index.tsx",
    );
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const rootRoute = await readGenerated(
      target,
      "src/views/main/routes/__root.tsx",
    );
    const routeTree = await readGenerated(
      target,
      "src/views/main/routeTree.gen.ts",
    );
    const appStyles = await readGenerated(
      target,
      "src/views/main/styles/app.css",
    );
    const biome = await readGenerated(target, "biome.json");
    const packageJson = await readGenerated(target, "package.json");
    const readme = await readGenerated(target, "README.md");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const manifestText = await readGenerated(target, "ces.json");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"@tanstack/router-plugin"');
    expect(packageJson).not.toContain('"@tanstack/react-query"');
    expect(packageJson).toContain('"cross-env"');
    expect(packageJson).toContain("CES_DEV_RELOAD=1 electrobun dev");
    expect(viteConfig).toContain(
      'import { tanstackRouter } from "@tanstack/router-plugin/vite"',
    );
    expect(viteConfig).toContain('routesDirectory: "./routes"');
    expect(viteConfig).toContain('generatedRouteTree: "./routeTree.gen.ts"');
    expect(viteConfig.indexOf("tanstackRouter({")).toBeLessThan(
      viteConfig.indexOf("rendererPlugin,"),
    );
    expect(rootRoute).toContain("export const Route = createRootRoute");
    expect(route).toContain('export const Route = createFileRoute("/")');
    expect(route).toContain("component: Home");
    expect(route).not.toContain("createRoute({");
    expect(routeTree).toContain("FileRoutesByPath");
    expect(routeTree).toContain("_addFileChildren");
    expect(biome).toContain("!src/views/main/routeTree.gen.ts");
    expect(home).toContain("launchSteps");
    expect(home).toContain("Launch sequence");
    expect(home).toContain('role="progressbar"');
    expect(home).toContain("toggleStep");
    expect(home).toContain("rpc.request.greet");
    expect(home).toContain("rpc.send.logToBun");
    expect(appStyles).toContain(".steps-section");
    expect(appStyles).toContain(".step-card");
    expect(appStyles).toContain("height: 100dvh");
    expect(appStyles).toContain("overflow-y: auto");
    expect(readme).toContain("## RPC Example");
    expect(manifestText).toContain('"frontend": ["react"]');
    expect(manifestText).toContain('"addons": [');
    expect(manifest.$schema).toContain("create-electrobun-stack@");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(Date.parse(manifest.createdAt)).not.toBeNaN();
    expect(manifest.reproducibleCommand).toContain(
      "bunx create-electrobun-stack@",
    );
    expect(manifest.reproducibleCommand).toContain("--router tanstack-router");
    expect(manifest.reproducibleCommand).toContain("--query none");
    expect(manifest.reproducibleCommand).toContain("--testing bun");
    expect(manifest.reproducibleCommand).toContain("--navigation local-only");
    expect(manifest.reproducibleCommand).toContain("--native-utils none");
    expect(manifest.reproducibleCommand).toContain("--window-style native");
    expect(manifest.reproducibleCommand).toContain("--settings none");
    expect(manifest.reproducibleCommand).toContain("--packaging none");
    expect(manifest.reproducibleCommand).toContain("--no-install");
    expect(manifest.projectName).toBe("sample-app");
    expect(manifest.packageName).toBe("sample-app");
    expect(manifest.appIdentifier).toBe("dev.electrobun.sampleapp");
    expect(manifest.template).toBe("minimal");
    expect(manifest.frontend).toEqual(["react"]);
    expect(manifest.router).toBe("tanstack-router");
    expect(manifest.query).toBe("none");
    expect(manifest.addons).toEqual([
      "biome",
      "electrobun",
      "bun-test",
      "app-menu",
      "navigation-guard",
      "tanstack-router",
    ]);
    expect(manifest.examples).toEqual(["rpc"]);
    expect(manifest.testing).toBe("bun");
    expect(manifest.appMenu).toBe("edit");
    expect(manifest.navigation).toBe("local-only");
    expect(manifest.nativeUtils).toBe("none");
    expect(manifest.windowStyle).toBe("native");
    expect(manifest.buildEnv).toBe("dev");
    expect(manifest.buildTargets).toBe("current");
    expect(manifest.packaging).toBe("none");
    expect(manifest.settings).toBe("none");
    expect(manifest.features).toMatchObject({
      databaseSettings: false,
      desktopSmokeTest: false,
      editMenu: true,
      electrobun: true,
      electrobunRpc: true,
      hiddenInsetTitlebar: false,
      installerPackaging: false,
      jsonDatabase: false,
      jsonSettings: false,
      localNavigationGuard: true,
      nativeClipboard: false,
      nativeFileDialogs: false,
      preact: false,
      react: true,
      reactRouter: false,
      rpcExample: true,
      bunTest: true,
      settingsStore: false,
      shadcn: false,
      sqlite: false,
      tailwindcss: true,
      tanstackQuery: false,
      tanstackRouter: true,
    });
  });

  test("renders installer packaging helpers when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      packaging: "installers",
    });
    const packageJson = await readGenerated(target, "package.json");
    const tsconfig = await readGenerated(target, "tsconfig.json");
    const readme = await readGenerated(target, "README.md");
    const packagingScript = await readGenerated(
      target,
      "scripts/package-electrobun.ts",
    );
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"package:release"');
    expect(packageJson).toContain("electrobun build --env=stable");
    expect(packageJson).toContain('"package:linux"');
    expect(packageJson).toContain('"package:mac"');
    expect(packageJson).toContain('"package:windows"');
    expect(tsconfig).toContain('"scripts"');
    expect(readme).toContain("## Installer Packaging");
    expect(readme).toContain("AppImage requires `appimagetool`");
    expect(packagingScript).toContain("appimagetool");
    expect(packagingScript).toContain("dpkg-deb");
    expect(packagingScript).toContain("makensis");
    expect(manifest.packaging).toBe("installers");
    expect(manifest.addons).toContain("installer-packaging");
    expect(manifest.features.installerPackaging).toBe(true);
  });

  test("renders without renderer routing when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      router: "none",
    });
    const packageJson = await readGenerated(target, "package.json");
    const app = await readGenerated(target, "src/views/main/app.tsx");
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const biome = await readGenerated(target, "biome.json");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).not.toContain('"@tanstack/react-router"');
    expect(packageJson).not.toContain('"@tanstack/router-plugin"');
    expect(packageJson).not.toContain('"react-router"');
    expect(app).toContain('import { Home } from "./home"');
    expect(app).toContain("const AppView = () => <Home />");
    expect(home).toContain("No router");
    expect(viteConfig).not.toContain("tanstackRouter");
    expect(biome).not.toContain("routeTree.gen.ts");
    expect(readme).toContain("- No router");
    expect(
      await Bun.file(join(target, "src/views/main/routeTree.gen.ts")).exists(),
    ).toBe(false);
    expect(
      await Bun.file(join(target, "src/views/main/routes/index.tsx")).exists(),
    ).toBe(false);
    expect(manifest.router).toBe("none");
    expect(manifest.addons).not.toContain("tanstack-router");
    expect(manifest.features).toMatchObject({
      reactRouter: false,
      tanstackRouter: false,
    });
  });

  test("renders Preact direct renderer when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      frontend: "preact",
      router: "none",
    });
    const packageJson = await readGenerated(target, "package.json");
    const main = await readGenerated(target, "src/views/main/main.tsx");
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const tsconfig = await readGenerated(target, "tsconfig.json");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"preact"');
    expect(packageJson).toContain('"@preact/preset-vite"');
    expect(packageJson).not.toContain('"react"');
    expect(packageJson).not.toContain('"react-dom"');
    expect(main).toContain('import { render } from "preact"');
    expect(main).not.toContain("createRoot");
    expect(home).toContain('from "preact/hooks"');
    expect(tsconfig).toContain('"jsxImportSource": "preact"');
    expect(viteConfig).toContain('import preact from "@preact/preset-vite"');
    expect(viteConfig).toContain("const rendererPlugin = preact()");
    expect(readme).toContain("- Preact + Vite renderer");
    expect(manifest.frontend).toEqual(["preact"]);
    expect(manifest.router).toBe("none");
    expect(manifest.features).toMatchObject({
      preact: true,
      react: false,
      vite: true,
    });
  });

  test("renders Svelte direct renderer when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      frontend: "svelte",
      router: "none",
    });
    const packageJson = await readGenerated(target, "package.json");
    const main = await readGenerated(target, "src/views/main/main.ts");
    const home = await readGenerated(target, "src/views/main/Home.svelte");
    const index = await readGenerated(target, "src/views/main/index.html");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"svelte"');
    expect(packageJson).toContain('"@sveltejs/vite-plugin-svelte"');
    expect(packageJson).toContain('"svelte-check"');
    expect(packageJson).not.toContain('"react"');
    expect(packageJson).not.toContain('"react-dom"');
    expect(main).toContain('import { mount } from "svelte"');
    expect(index).toContain("./main.ts");
    expect(home).toContain('<script lang="ts">');
    expect(home).not.toContain("{{");
    expect(viteConfig).toContain(
      'import { svelte } from "@sveltejs/vite-plugin-svelte"',
    );
    expect(viteConfig).toContain("svelte({ configFile: false })");
    expect(readme).toContain("- Svelte + Vite renderer");
    expect(manifest.frontend).toEqual(["svelte"]);
    expect(manifest.router).toBe("none");
    expect(manifest.features).toMatchObject({
      react: false,
      svelte: true,
      svelteKit: false,
      vite: true,
    });
  });

  test("renders SvelteKit static renderer when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      frontend: "sveltekit",
      router: "none",
    });
    const packageJson = await readGenerated(target, "package.json");
    const svelteConfig = await readGenerated(target, "svelte.config.js");
    const layout = await readGenerated(
      target,
      "src/views/main/routes/+layout.svelte",
    );
    const routeOptions = await readGenerated(
      target,
      "src/views/main/routes/+layout.ts",
    );
    const page = await readGenerated(
      target,
      "src/views/main/routes/+page.svelte",
    );
    const appTemplate = await readGenerated(target, "src/views/main/app.html");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"@sveltejs/kit"');
    expect(packageJson).toContain('"@sveltejs/adapter-static"');
    expect(packageJson).toContain("svelte-kit sync && svelte-check");
    expect(svelteConfig).toContain('pages: ".electrobun/views/main"');
    expect(svelteConfig).toContain('"@": "src"');
    expect(layout).toContain("../styles/globals.css");
    expect(routeOptions).toContain("export const prerender = true");
    expect(routeOptions).toContain("export const ssr = false");
    expect(page).toContain("../Home.svelte");
    expect(appTemplate).toContain("%sveltekit.body%");
    expect(viteConfig).toContain('from "@sveltejs/kit/vite"');
    expect(viteConfig).not.toContain('root: "src/views/main"');
    expect(readme).toContain("- SvelteKit + Vite renderer");
    expect(readme).toContain("- SvelteKit file routing");
    expect(manifest.frontend).toEqual(["sveltekit"]);
    expect(manifest.router).toBe("none");
    expect(manifest.features).toMatchObject({
      react: false,
      svelte: false,
      svelteKit: true,
      vite: true,
    });
  });

  test("renders React Router when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      router: "react-router",
    });
    const packageJson = await readGenerated(target, "package.json");
    const app = await readGenerated(target, "src/views/main/app.tsx");
    const viteConfig = await readGenerated(target, "vite.config.ts");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"react-router"');
    expect(packageJson).not.toContain('"@tanstack/react-router"');
    expect(packageJson).not.toContain('"@tanstack/router-plugin"');
    expect(app).toContain('from "react-router"');
    expect(app).toContain("<HashRouter>");
    expect(app).toContain('<Route element={<Home />} path="/" />');
    expect(viteConfig).not.toContain("tanstackRouter");
    expect(
      await Bun.file(join(target, "src/views/main/routes/index.tsx")).exists(),
    ).toBe(false);
    expect(manifest.router).toBe("react-router");
    expect(manifest.addons).toContain("react-router");
    expect(manifest.features).toMatchObject({
      reactRouter: true,
      tanstackRouter: false,
    });
  });

  test("renders TanStack Query when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      query: "tanstack-query",
    });
    const packageJson = await readGenerated(target, "package.json");
    const app = await readGenerated(target, "src/views/main/app.tsx");
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"@tanstack/react-query"');
    expect(app).toContain("QueryClientProvider");
    expect(app).toContain("const queryClient = new QueryClient()");
    expect(home).toContain("TanStack Query");
    expect(manifest.query).toBe("tanstack-query");
    expect(manifest.addons).toContain("tanstack-query");
    expect(manifest.features.tanstackQuery).toBe(true);
  });

  test("omits demo RPC calls when examples are disabled", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      examples: "none",
    });
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const readme = await readGenerated(target, "README.md");

    expect(home).not.toContain("rpc.request.greet");
    expect(home).not.toContain("rpc.send.logToBun");
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
      "tanstack-router",
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

  test("renders desktop launch smoke tests when requested", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      testing: "desktop-smoke",
      windowStyle: "hidden-inset",
    });
    const packageJson = await readGenerated(target, "package.json");
    const smokeTest = await readGenerated(
      target,
      "tests/desktop-smoke.test.ts",
    );
    const manifest = await readGeneratedManifest(target);

    expect(packageJson).toContain('"test": "bun test"');
    expect(smokeTest).toContain("desktop launch smoke");
    expect(smokeTest).toContain("createMainWindow");
    expect(smokeTest).toContain('titleBarStyle).toBe("hiddenInset"');
    expect(manifest.testing).toBe("desktop-smoke");
    expect(manifest.addons).toContain("desktop-smoke-test");
    expect(manifest.features).toMatchObject({
      bunTest: true,
      desktopSmokeTest: true,
    });
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
    const home = await readGenerated(target, "src/views/main/home.tsx");
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
    expect(window).not.toContain("styleMask");
    expect(window).toContain("window.webview.setNavigationRules");
    expect(window).toContain('["^*", "views://*", "about:blank"]');
    expect(window).toContain("CES_DEV_RELOAD");
    expect(window).toContain("window.webview.loadURL(MAIN_VIEW_URL)");
    expect(window).not.toContain("will-navigate");
    expect(window).not.toContain("event.response = { allow: false }");
    expect(home).toContain("window-drag-bar");
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
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const manifest = await readGeneratedManifest(target);

    expect(window).not.toContain("mainViewRPC");
    expect(window).not.toContain("rpc:");
    expect(home).not.toContain("./lib/rpc");
    expect(home).toContain("Renderer ready");
    expect(manifest.api).toBe("none");
    expect(manifest.features.electrobunRpc).toBe(false);
  });

  test("renders native file dialog utility option", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      nativeUtils: "file-dialogs",
    });
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const handlers = await readGenerated(target, "src/bun/rpc/handlers.ts");
    const schema = await readGenerated(target, "src/shared/rpc/schema.ts");
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const types = await readGenerated(target, "src/shared/types.ts");
    const manifest = await readGeneratedManifest(target);

    expect(handlers).toContain('import { Utils } from "electrobun/bun"');
    expect(handlers).toContain("Utils.openFileDialog");
    expect(schema).toContain("openFileDialog");
    expect(schema).toContain("FileDialogResult");
    expect(router).toContain("openFileDialog");
    expect(types).toContain("FileDialogResult");
    expect(home).toContain("openNativeFileDialog");
    expect(home).toContain("Native utility");
    expect(home).toContain("File dialogs");
    expect(manifest.nativeUtils).toBe("file-dialogs");
    expect(manifest.addons).toContain("native-file-dialogs");
    expect(manifest.features.nativeFileDialogs).toBe(true);
  });

  test("renders desktop native utility kit with clipboard", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      nativeUtils: "desktop-kit",
    });
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const handlers = await readGenerated(target, "src/bun/rpc/handlers.ts");
    const schema = await readGenerated(target, "src/shared/rpc/schema.ts");
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const types = await readGenerated(target, "src/shared/types.ts");
    const manifest = await readGeneratedManifest(target);

    expect(handlers).toContain("Utils.openFileDialog");
    expect(handlers).toContain("Utils.clipboardReadText");
    expect(handlers).toContain("Utils.clipboardWriteText");
    expect(schema).toContain("readClipboard");
    expect(schema).toContain("writeClipboard");
    expect(router).toContain("clearClipboard");
    expect(router).toContain("openFileDialog");
    expect(types).toContain("ClipboardStatus");
    expect(home).toContain("writeNativeClipboard");
    expect(home).toContain("Clipboard");
    expect(home).toContain("File dialogs");
    expect(manifest.nativeUtils).toBe("desktop-kit");
    expect(manifest.addons).toContain("native-file-dialogs");
    expect(manifest.addons).toContain("native-clipboard");
    expect(manifest.features).toMatchObject({
      nativeClipboard: true,
      nativeFileDialogs: true,
    });
  });

  test("renders app lock auth option", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      auth: "app-lock",
    });
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const styles = await readGenerated(target, "src/views/main/styles/app.css");
    const manifest = await readGeneratedManifest(target);

    expect(home).toContain("Local session");
    expect(home).toContain("setIsUnlocked");
    expect(styles).toContain(".lock-form");
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

  test("renders JSON file database with seed data", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      database: "json-file",
      dbSetup: "seed",
    });
    const dbClient = await readGenerated(target, "src/bun/db/client.ts");
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(dbClient).toContain("app-db.json");
    expect(dbClient).toContain("JSON file database is ready.");
    expect(dbClient).toContain('driver: "json-file"');
    expect(home).toContain("JSON file");
    expect(readme).toContain("- JSON file database");
    expect(manifest.database).toBe("json-file");
    expect(manifest.dbSetup).toBe("seed");
    expect(manifest.addons).toContain("json-database");
    expect(manifest.features).toMatchObject({
      jsonDatabase: true,
      sqlite: false,
    });
  });

  test("renders VS Code-style JSON settings storage", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      settings: "json",
    });
    const store = await readGenerated(target, "src/bun/settings/store.ts");
    const schema = await readGenerated(target, "src/shared/rpc/schema.ts");
    const router = await readGenerated(target, "src/bun/rpc/router.ts");
    const home = await readGenerated(target, "src/views/main/home.tsx");
    const readme = await readGenerated(target, "README.md");
    const manifest = await readGeneratedManifest(target);

    expect(store).toContain("settings.json");
    expect(store).toContain('"app.theme"');
    expect(store).toContain('storage: "json"');
    expect(store).toContain("updateSetting");
    expect(schema).toContain("SettingsStatus");
    expect(schema).toContain("SettingValue");
    expect(schema).toContain("getSettingsStatus");
    expect(schema).toContain("updateSetting");
    expect(router).toContain("getSettingsStatus");
    expect(router).toContain("updateSetting");
    expect(home).toContain("rpc.request.getSettingsStatus");
    expect(home).toContain('saveSetting("app.theme", theme)');
    expect(readme).toContain("VS Code-style JSON settings store");
    expect(manifest.settings).toBe("json");
    expect(manifest.addons).toContain("settings-json");
    expect(manifest.features).toMatchObject({
      databaseSettings: false,
      jsonSettings: true,
      settingsStore: true,
    });
  });

  test("renders SQLite-backed settings storage", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      database: "sqlite",
      settings: "database",
    });
    const store = await readGenerated(target, "src/bun/settings/store.ts");
    const manifest = await readGeneratedManifest(target);

    expect(store).toContain("app_settings");
    expect(store).toContain("databasePath");
    expect(store).toContain('storage: "database"');
    expect(store).toContain("on conflict(key) do update");
    expect(manifest.settings).toBe("database");
    expect(manifest.addons).toContain("settings-database");
    expect(manifest.features).toMatchObject({
      databaseSettings: true,
      jsonSettings: false,
      settingsStore: true,
      sqlite: true,
    });
  });

  test("renders Drizzle schema for database-backed settings", async () => {
    const target = await renderMinimal({
      ...defaultStackOptions,
      database: "sqlite",
      orm: "drizzle",
      settings: "database",
    });
    const schema = await readGenerated(target, "src/bun/db/schema.ts");
    const store = await readGenerated(target, "src/bun/settings/store.ts");
    const manifest = await readGeneratedManifest(target);

    expect(schema).toContain("appSettings");
    expect(schema).toContain('sqliteTable("app_settings"');
    expect(store).toContain('from "../db/client"');
    expect(manifest.features).toMatchObject({
      databaseSettings: true,
      drizzle: true,
    });
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
    const tsconfig = await readGenerated(target, "tsconfig.json");
    const styles = await readGenerated(
      target,
      "src/views/main/styles/globals.css",
    );

    expect(await Bun.file(join(target, "components.json")).exists()).toBe(true);
    expect(packageJson).toContain('"shadcn"');
    expect(tsconfig).toContain('"baseUrl": "."');
    expect(tsconfig).toContain('"@/*": ["./src/*"]');
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
