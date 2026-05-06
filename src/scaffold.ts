import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { StackOptions } from "./options";
import { copyTemplate } from "./utils/copy-template";

export type TemplateName = "minimal" | "standard" | "full";

export type ScaffoldOptions = {
  appIdentifier: string;
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
  hasDatabase: options.stack.database === "sqlite",
  hasDrizzle: options.stack.orm === "drizzle",
  hasRpcExample: options.stack.examples === "rpc",
  hasShadcn: options.stack.ui === "shadcn",
  hasTailwind: options.stack.styling === "tailwindcss",
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

  return directories;
};

export const scaffoldProject = async (
  options: ScaffoldOptions,
): Promise<void> => {
  const templateDirectory = join(templateRoot, options.template);
  const baseDirectory = join(templateDirectory, "base");
  const sourceExists = await pathExists(baseDirectory);

  if (!sourceExists) {
    throw new Error(`Template is not implemented yet: ${options.template}`);
  }

  await assertWritableTarget(options.targetDirectory);

  const replacements = {
    __APP_IDENTIFIER__: options.appIdentifier,
    __APP_NAME__: createDisplayName(options.projectName),
    __PACKAGE_NAME__: options.packageName,
    __PROJECT_NAME__: options.projectName,
  };
  const data = templateData(options);

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
};
