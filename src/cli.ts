import { resolve } from "node:path";
import { intro, note, outro, spinner } from "@clack/prompts";
import {
  defaultStackOptions,
  formatStackOptions,
  getUnsupportedStackOptions,
  isStackFlagName,
  type StackOptions,
  setStackOption,
  validateStackOptions,
} from "./options";
import { git, packageManager } from "./package-manager";
import { promptProjectName } from "./prompts";
import { scaffoldProject, type TemplateName } from "./scaffold";
import { formatList } from "./utils/format";
import { logger } from "./utils/logger";
import {
  createPackageName,
  validateProjectName,
} from "./utils/validate-project-name";

type CliOptions = {
  appIdentifier: string | null;
  cwd: string;
  dryRun: boolean;
  git: boolean;
  help: boolean;
  install: boolean;
  listTemplates: boolean;
  projectName: string | null;
  stack: StackOptions;
  template: TemplateName | null;
  version: boolean;
  yes: boolean;
};

const templateNames = ["minimal", "standard", "full"] as const;
const defaultTemplate: TemplateName = "minimal";
const packageVersion = "0.1.0";

const isTemplateName = (value: string): value is TemplateName =>
  templateNames.some((templateName) => templateName === value);

const readFlagValue = (
  args: Array<string>,
  index: number,
): string | undefined => {
  const nextValue = args[index + 1];
  return nextValue && !nextValue.startsWith("-") ? nextValue : undefined;
};

const readRequiredFlagValue = (
  args: Array<string>,
  index: number,
  flag: string,
): string => {
  const value = readFlagValue(args, index);

  if (!value) {
    throw new Error(`Expected ${flag} to have a value.`);
  }

  return value;
};

const isValidAppIdentifier = (value: string): boolean =>
  /^[a-zA-Z][a-zA-Z0-9.-]+[a-zA-Z0-9]$/.test(value) && value.includes(".");

const createAppIdentifier = (packageName: string): string => {
  const normalized = packageName
    .replaceAll("/", "-")
    .replaceAll("@", "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "")
    .split("-")
    .filter(Boolean)
    .join("");

  return `dev.electrobun.${normalized || "app"}`;
};

const printTemplates = (): void => {
  logger.heading("Templates");
  logger.info("  minimal   implemented, default");
  logger.info("  standard  planned");
  logger.info("  full      planned");
};

const printHelp = (): void => {
  logger.heading("create-electrobun-stack");
  logger.info(`
Usage:
  bunx create-electrobun-stack my-app
  bunx create-electrobun-stack my-app --frontend react --backend electrobun --runtime bun
  bun run src/index.ts my-app --no-install --git

Defaults:
  --template ${defaultTemplate}
  --frontend react --backend electrobun --runtime bun --api electrobun-rpc
  --auth none --payments none --database none --orm none --db-setup none
  --package-manager bun --web-deploy none --server-deploy none
  --addons none --examples rpc --install --no-git

Options:
  --template minimal|standard|full
  --frontend react|next|none
  --backend electrobun|hono|none
  --runtime bun
  --api electrobun-rpc|trpc|none
  --auth none|better-auth
  --payments none
  --database none|sqlite
  --orm none|drizzle
  --db-setup none
  --package-manager bun
  --web-deploy none
  --server-deploy none
  --addons none|turborepo
  --examples rpc|none
  --install / --no-install
  --git / --no-git
  --cwd <path>
  --app-id <identifier>
  --yes
  --dry-run
  --list-templates
  --version
  --help`);
};

const parseArgs = (args: Array<string>): CliOptions => {
  let appIdentifier: string | null = null;
  let cwd = process.cwd();
  let dryRun = false;
  let projectName: string | null = null;
  let template: TemplateName | null = null;
  let install = true;
  let gitEnabled = false;
  let help = false;
  let listTemplates = false;
  let version = false;
  let yes = false;
  const stack: StackOptions = { ...defaultStackOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      version = true;
      continue;
    }

    if (arg === "--list-templates") {
      listTemplates = true;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--yes" || arg === "-y") {
      yes = true;
      continue;
    }

    if (arg === "--cwd") {
      cwd = resolve(readRequiredFlagValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg.startsWith("--cwd=")) {
      cwd = resolve(arg.slice("--cwd=".length));
      continue;
    }

    if (arg === "--app-id") {
      appIdentifier = readRequiredFlagValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg.startsWith("--app-id=")) {
      appIdentifier = arg.slice("--app-id=".length);
      continue;
    }

    if (arg === "--no-install") {
      install = false;
      continue;
    }

    if (arg === "--install") {
      install = true;
      continue;
    }

    if (arg === "--git") {
      gitEnabled = true;
      continue;
    }

    if (arg === "--no-git") {
      gitEnabled = false;
      continue;
    }

    if (arg === "--template" || arg === "-t") {
      const value = readRequiredFlagValue(args, index, arg);
      if (!value || !isTemplateName(value)) {
        throw new Error(
          `Expected --template to be one of: ${formatList([...templateNames])}`,
        );
      }
      template = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--template=")) {
      const value = arg.slice("--template=".length);
      if (!isTemplateName(value)) {
        throw new Error(
          `Expected --template to be one of: ${formatList([...templateNames])}`,
        );
      }
      template = value;
      continue;
    }

    if (arg.startsWith("--")) {
      const [rawFlag, inlineValue] = arg.slice(2).split("=", 2);

      if (rawFlag && isStackFlagName(rawFlag)) {
        const value =
          inlineValue ?? readRequiredFlagValue(args, index, `--${rawFlag}`);

        setStackOption(stack, rawFlag, value);

        if (!inlineValue) {
          index += 1;
        }

        continue;
      }
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (projectName) {
      throw new Error(
        `Received multiple project names: "${projectName}" and "${arg}".`,
      );
    }

    projectName = arg;
  }

  return {
    appIdentifier,
    cwd,
    dryRun,
    git: gitEnabled,
    help,
    install,
    listTemplates,
    projectName,
    stack,
    template,
    version,
    yes,
  };
};

const runStep = async (
  message: string,
  task: () => Promise<void>,
): Promise<void> => {
  const s = spinner();
  s.start(message);

  try {
    await task();
    s.stop(message);
  } catch (error: unknown) {
    s.error(message);
    throw error;
  }
};

export const runCli = async (args: Array<string>): Promise<void> => {
  try {
    const options = parseArgs(args);

    if (options.version) {
      logger.info(packageVersion);
      return;
    }

    if (options.help) {
      printHelp();
      return;
    }

    if (options.listTemplates) {
      printTemplates();
      return;
    }

    if (!options.projectName && options.yes) {
      throw new Error("Project name is required when using --yes.");
    }

    if (!options.projectName && !process.stdin.isTTY) {
      throw new Error("Project name is required in non-interactive mode.");
    }

    const projectName = options.projectName ?? (await promptProjectName());
    const validation = validateProjectName(projectName);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const template = options.template ?? defaultTemplate;
    const packageName = createPackageName(projectName);
    const targetDirectory = resolve(options.cwd, projectName);
    const appIdentifier =
      options.appIdentifier ?? createAppIdentifier(packageName);

    if (!isValidAppIdentifier(appIdentifier)) {
      throw new Error(
        `App identifier must be reverse-DNS style, for example dev.example.${packageName.replaceAll(
          /[^a-z0-9]/g,
          "",
        )}.`,
      );
    }

    intro("create-electrobun-stack");
    note(
      [
        `Project: ${projectName}`,
        `Template: ${template}`,
        "Package manager: bun",
        `Install: ${options.install ? "yes" : "no"}`,
        `Git: ${options.git ? "yes" : "no"}`,
      ].join("\n"),
      "Resolved stack",
    );

    if (options.dryRun) {
      const unsupported = getUnsupportedStackOptions(options.stack);

      logger.box([
        "Dry run:",
        `target: ${targetDirectory}`,
        `package: ${packageName}`,
        `identifier: ${appIdentifier}`,
        "stack:",
        ...formatStackOptions(options.stack).map((item) => `  ${item}`),
        unsupported.length > 0
          ? `planned: ${unsupported.map((item) => item.flag).join(", ")}`
          : "planned: none",
      ]);
      outro("No files were written.");
      return;
    }

    validateStackOptions(options.stack);

    await runStep("Scaffolding files", () =>
      scaffoldProject({
        appIdentifier,
        packageName,
        projectName,
        targetDirectory,
        template,
      }),
    );

    logger.success(`Created ${projectName} with the ${template} template.`);

    if (options.git) {
      await runStep("Initializing git repository", () =>
        git.init(targetDirectory),
      );
    }

    let installed = false;
    if (options.install) {
      try {
        await runStep("Installing dependencies with Bun", () =>
          packageManager.install(targetDirectory),
        );
        installed = true;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.warn(`Dependency install failed: ${message}`);
        logger.info(
          "The project was created. Run bun install inside it when ready.",
        );
      }
    }

    logger.box([
      "Next steps:",
      `cd ${projectName}`,
      installed ? "bun run dev" : "bun install",
      installed ? "bun run typecheck" : "bun run dev",
    ]);
    outro("Ready.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(message);
    process.exitCode = 1;
  }
};
