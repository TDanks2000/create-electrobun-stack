import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { copyTemplate } from "./utils/copy-template";

export type TemplateName = "minimal" | "standard" | "full";

export type ScaffoldOptions = {
  appIdentifier: string;
  packageName: string;
  projectName: string;
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

export const scaffoldProject = async (
  options: ScaffoldOptions,
): Promise<void> => {
  const sourceDirectory = join(templateRoot, options.template);
  const sourceExists = await pathExists(sourceDirectory);

  if (!sourceExists) {
    throw new Error(`Template is not implemented yet: ${options.template}`);
  }

  await assertWritableTarget(options.targetDirectory);

  await copyTemplate({
    replacements: {
      __APP_IDENTIFIER__: options.appIdentifier,
      __APP_NAME__: createDisplayName(options.projectName),
      __PACKAGE_NAME__: options.packageName,
      __PROJECT_NAME__: options.projectName,
    },
    sourceDirectory,
    targetDirectory: options.targetDirectory,
  });
};
