import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { createCesManifest, serializeCesManifest } from "./manifest";
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

const templateRoot = join(
  dirname(new URL(import.meta.url).pathname),
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
  hasDatabase: options.stack.database === "sqlite",
  hasDrizzle: options.stack.orm === "drizzle",
  hasElectrobunRpc: options.stack.api === "electrobun-rpc",
  hasHiddenInsetTitlebar: options.stack.windowStyle === "hidden-inset",
  hasNavigationGuard: options.stack.navigation === "local-only",
  hasRpcExample: options.stack.examples === "rpc",
  hasSeedData: options.stack.dbSetup === "seed",
  hasShadcn: options.stack.ui === "shadcn",
  hasDatabaseSettings: options.stack.settings === "database",
  hasJsonSettings: options.stack.settings === "json",
  hasSettings: options.stack.settings !== "none",
  hasTailwind: options.stack.styling === "tailwindcss",
  hasTesting: options.stack.testing === "bun",
  hasTurborepo: options.stack.addons === "turborepo",
  packageManagerSpec: getPackageManagerSpec(options.stack.packageManager),
  commands: {
    build: getRunCommand(options.stack.packageManager, "build"),
    check: getRunCommand(options.stack.packageManager, "check"),
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

  await Bun.write(
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
