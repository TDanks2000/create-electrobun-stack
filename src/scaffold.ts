import { readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CesManifest,
  createCesManifest,
  serializeCesManifest,
} from "./manifest";
import type { StackOptions } from "./options";
import { getPackageVersion } from "./package-info";
import {
  getInstallCommand,
  getPackageManagerSpec,
  getRunCommand,
} from "./package-manager";
import { copyTemplate } from "./utils/copy-template";

export type TemplateName = "minimal" | "standard" | "full";

export type ScaffoldOptions = {
  appIdentifier: string;
  git?: boolean;
  install?: boolean;
  packageName: string;
  projectName: string;
  stack: StackOptions;
  targetDirectory: string;
  template: TemplateName;
};

export type AddToProjectOptions = {
  install?: boolean;
  manifest: CesManifest;
  stack: StackOptions;
  targetDirectory: string;
};

const templateRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
);

const templateSources = {
  full: "minimal",
  minimal: "minimal",
  standard: "minimal",
} as const satisfies Record<TemplateName, string>;

const createDisplayName = (projectName: string): string =>
  projectName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const createRouterDisplayName = (stack: StackOptions): string => {
  switch (stack.router) {
    case "react-router":
      return "React Router";
    case "tanstack-router":
      return "TanStack Router";
    case "none":
      return "No router";
  }
};

const createDatabaseDisplayName = (stack: StackOptions): string => {
  switch (stack.database) {
    case "json-file":
      return "JSON file";
    case "sqlite":
      return "SQLite";
    case "none":
      return "No database";
  }
};

const createFrontendDisplayName = (stack: StackOptions): string => {
  switch (stack.frontend) {
    case "preact":
      return "Preact";
    case "react":
      return "React";
  }
};

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const assertWritableTarget = async (targetDirectory: string): Promise<void> => {
  try {
    const targetStat = await stat(targetDirectory);

    if (!targetStat.isDirectory()) {
      throw new Error(
        `Target exists but is not a directory: ${basename(targetDirectory)}`,
      );
    }

    const entries = await readdir(targetDirectory);

    if (entries.length > 0) {
      throw new Error(
        `Target directory is not empty: ${basename(
          targetDirectory,
        )}. Choose a new project name or empty the directory first.`,
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
};

const templateData = (options: ScaffoldOptions): Record<string, unknown> => ({
  appIdentifier: options.appIdentifier,
  appName: createDisplayName(options.projectName),
  hasAppLock: options.stack.auth === "app-lock",
  hasAppMenu: options.stack.appMenu === "edit",
  hasDatabase: options.stack.database !== "none",
  hasDesktopSmokeTest: options.stack.testing === "desktop-smoke",
  hasDrizzle: options.stack.orm === "drizzle",
  hasElectrobunRpc: options.stack.api === "electrobun-rpc",
  hasHiddenInsetTitlebar: options.stack.windowStyle === "hidden-inset",
  hasJsonDatabase: options.stack.database === "json-file",
  hasNavigationGuard: options.stack.navigation === "local-only",
  hasRpcExample: options.stack.examples === "rpc",
  hasSeedData: options.stack.dbSetup === "seed",
  hasShadcn: options.stack.ui === "shadcn",
  hasDatabaseSettings: options.stack.settings === "database",
  hasJsonSettings: options.stack.settings === "json",
  hasNativeClipboard:
    options.stack.nativeUtils === "clipboard" ||
    options.stack.nativeUtils === "desktop-kit",
  hasNativeFileDialogs:
    options.stack.nativeUtils === "file-dialogs" ||
    options.stack.nativeUtils === "desktop-kit",
  hasSettings: options.stack.settings !== "none",
  hasPreactFrontend: options.stack.frontend === "preact",
  hasReactFrontend: options.stack.frontend === "react",
  hasReactRouter: options.stack.router === "react-router",
  hasSqlite: options.stack.database === "sqlite",
  hasTailwind: options.stack.styling === "tailwindcss",
  hasTanstackQuery: options.stack.query === "tanstack-query",
  hasTanstackRouter: options.stack.router === "tanstack-router",
  hasTesting: options.stack.testing !== "none",
  hasTurborepo: options.stack.addons === "turborepo",
  hasRouter: options.stack.router !== "none",
  databaseDisplayName: createDatabaseDisplayName(options.stack),
  frontendDisplayName: createFrontendDisplayName(options.stack),
  homeFilePath:
    options.stack.router === "tanstack-router"
      ? "src/views/main/routes/index.tsx"
      : "src/views/main/home.tsx",
  packageManagerSpec: getPackageManagerSpec(options.stack.packageManager),
  routerDisplayName: createRouterDisplayName(options.stack),
  commands: {
    build: getRunCommand(options.stack.packageManager, "build"),
    check: getRunCommand(options.stack.packageManager, "check"),
    dbGenerate: getRunCommand(options.stack.packageManager, "db:generate"),
    dbStudio: getRunCommand(options.stack.packageManager, "db:studio"),
    dev: getRunCommand(options.stack.packageManager, "dev"),
    format: getRunCommand(options.stack.packageManager, "format"),
    install: getInstallCommand(options.stack.packageManager),
    lint: getRunCommand(options.stack.packageManager, "lint"),
    test: getRunCommand(options.stack.packageManager, "test"),
    typecheck: getRunCommand(options.stack.packageManager, "typecheck"),
  },
  packageName: options.packageName,
  projectName: options.projectName,
  stack: options.stack,
});

const optionTemplateDirectories = (
  templateDirectory: string,
  stack: StackOptions,
): Array<string> => {
  const directories: Array<string> = [];

  if (stack.database === "sqlite") {
    directories.push(join(templateDirectory, "options", "database", "sqlite"));
  }

  if (stack.database === "json-file") {
    directories.push(
      join(templateDirectory, "options", "database", "json-file"),
    );
  }

  if (stack.orm === "drizzle") {
    directories.push(join(templateDirectory, "options", "orm", "drizzle"));
  }

  if (stack.styling === "tailwindcss") {
    directories.push(
      join(templateDirectory, "options", "styling", "tailwindcss"),
    );
  }

  if (stack.ui === "shadcn") {
    directories.push(join(templateDirectory, "options", "ui", "shadcn"));
  }

  if (stack.router === "tanstack-router") {
    directories.push(
      join(templateDirectory, "options", "router", "tanstack-router"),
    );
  }

  if (stack.settings === "json") {
    directories.push(join(templateDirectory, "options", "settings", "json"));
  }

  if (stack.settings === "database") {
    directories.push(
      join(templateDirectory, "options", "settings", "database"),
    );
  }

  if (stack.appMenu === "edit") {
    directories.push(join(templateDirectory, "options", "app-menu", "edit"));
  }

  if (stack.addons === "turborepo") {
    directories.push(join(templateDirectory, "options", "addons", "turborepo"));
  }

  if (stack.testing === "bun") {
    directories.push(join(templateDirectory, "options", "testing", "bun"));
  }

  if (stack.testing === "desktop-smoke") {
    directories.push(join(templateDirectory, "options", "testing", "bun"));
    directories.push(
      join(templateDirectory, "options", "testing", "desktop-smoke"),
    );
  }

  return directories;
};

export const scaffoldProject = async (
  options: ScaffoldOptions,
): Promise<void> => {
  const sourceTemplate = templateSources[options.template];
  const templateDirectory = join(templateRoot, sourceTemplate);
  const baseDirectory = join(templateDirectory, "base");
  const sourceExists = await pathExists(baseDirectory);

  if (!sourceExists) {
    throw new Error(`Template source is missing: ${options.template}`);
  }

  await assertWritableTarget(options.targetDirectory);

  const replacements = {
    __APP_IDENTIFIER__: options.appIdentifier,
    __APP_NAME__: createDisplayName(options.projectName),
    __PACKAGE_NAME__: options.packageName,
    __PROJECT_NAME__: options.projectName,
  };
  const data = templateData(options);
  const generatorVersion = await getPackageVersion();

  await copyTemplate({
    replacements,
    sourceDirectory: baseDirectory,
    targetDirectory: options.targetDirectory,
    templateData: data,
  });

  for (const optionDirectory of optionTemplateDirectories(
    templateDirectory,
    options.stack,
  )) {
    await copyTemplate({
      replacements,
      sourceDirectory: optionDirectory,
      targetDirectory: options.targetDirectory,
      templateData: data,
    });
  }

  await writeFile(
    join(options.targetDirectory, "ces.json"),
    serializeCesManifest(
      createCesManifest({
        appIdentifier: options.appIdentifier,
        generatorVersion,
        git: options.git ?? false,
        install: options.install ?? false,
        packageName: options.packageName,
        projectName: options.projectName,
        stack: options.stack,
        template: options.template,
      }),
    ),
  );
};

export const addToProject = async (
  options: AddToProjectOptions,
): Promise<void> => {
  const sourceTemplate = templateSources[options.manifest.template];
  const templateDirectory = join(templateRoot, sourceTemplate);
  const baseDirectory = join(templateDirectory, "base");
  const sourceExists = await pathExists(baseDirectory);

  if (!sourceExists) {
    throw new Error(`Template source is missing: ${options.manifest.template}`);
  }

  const replacements = {
    __APP_IDENTIFIER__: options.manifest.appIdentifier,
    __APP_NAME__: createDisplayName(options.manifest.projectName),
    __PACKAGE_NAME__: options.manifest.packageName,
    __PROJECT_NAME__: options.manifest.projectName,
  };
  const data = templateData({
    appIdentifier: options.manifest.appIdentifier,
    git: options.manifest.git,
    install: options.install ?? options.manifest.install,
    packageName: options.manifest.packageName,
    projectName: options.manifest.projectName,
    stack: options.stack,
    targetDirectory: options.targetDirectory,
    template: options.manifest.template,
  });
  const generatorVersion = await getPackageVersion();

  await copyTemplate({
    replacements,
    sourceDirectory: baseDirectory,
    targetDirectory: options.targetDirectory,
    templateData: data,
  });

  for (const optionDirectory of optionTemplateDirectories(
    templateDirectory,
    options.stack,
  )) {
    await copyTemplate({
      replacements,
      sourceDirectory: optionDirectory,
      targetDirectory: options.targetDirectory,
      templateData: data,
    });
  }

  await writeFile(
    join(options.targetDirectory, "ces.json"),
    serializeCesManifest(
      createCesManifest({
        appIdentifier: options.manifest.appIdentifier,
        createdAt: options.manifest.createdAt,
        generatorVersion,
        git: options.manifest.git,
        install: options.manifest.install,
        packageName: options.manifest.packageName,
        projectName: options.manifest.projectName,
        stack: options.stack,
        template: options.manifest.template,
      }),
    ),
  );
};
