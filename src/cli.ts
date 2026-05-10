import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { intro, note, outro, spinner } from "@clack/prompts";
import { type CesManifest, stackOptionsFromCesManifest } from "./manifest";
import {
  defaultStackOptions,
  formatStackOptions,
  getUnsupportedStackOptions,
  isStackFlagName,
  type StackOptionName,
  type StackOptions,
  setStackOption,
  stackFlagNames,
  validateStackOptions,
} from "./options";
import { getPackageVersion } from "./package-info";
import {
  getInstallCommand,
  getRunCommand,
  git,
  packageManager,
} from "./package-manager";
import {
  promptProjectName,
  promptStackOptions,
  promptTemplate,
} from "./prompts";
import { addToProject, scaffoldProject, type TemplateName } from "./scaffold";
import { formatList } from "./utils/format";
import { logger } from "./utils/logger";
import {
  createPackageName,
  validateProjectName,
} from "./utils/validate-project-name";

type CliCommand = "add" | "create";

type CliOptions = {
  appIdentifier: string | null;
  command: CliCommand;
  cwd: string;
  dryRun: boolean;
  git: boolean;
  help: boolean;
  install: boolean;
  listTemplates: boolean;
  projectName: string | null;
  stack: StackOptions;
  stackFlags: Set<StackOptionName>;
  template: TemplateName | null;
  version: boolean;
  yes: boolean;
};

const templateNames = ["minimal", "standard", "full"] as const;
const defaultTemplate: TemplateName = "minimal";

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
  logger.info("  standard  implemented profile");
  logger.info("  full      implemented profile");
};

const printHelp = (): void => {
  logger.heading("create-electrobun-stack");
  logger.info(`
Usage:
  bunx create-electrobun-stack my-app
  bunx create-electrobun-stack add --database sqlite
  bunx create-electrobun-stack my-app --frontend react --router tanstack-router --runtime bun --styling tailwindcss
  bun run src/index.ts my-app --no-install --git
  bun run src/index.ts add --cwd my-app --settings database

Defaults:
  Core stack:
    --template ${defaultTemplate}
    --frontend react --router tanstack-router --query none --runtime bun
    --styling tailwindcss --ui none
    --auth none --database none --orm none --db-setup none --settings none
  Electrobun features:
    --api electrobun-rpc --navigation local-only --native-utils none
    --window-style native --app-menu edit
    --build-env dev --build-targets current
  Tooling:
    --package-manager bun --testing bun --addons none --examples rpc
    --install --no-git

Options:
  Core stack:
    --template minimal|standard|full
    --frontend react
    --router tanstack-router|react-router|none
    --query none|tanstack-query
    --runtime bun
    --styling tailwindcss|css
    --ui none|shadcn
    --auth none|app-lock
    --database none|sqlite
    --orm none|drizzle
    --db-setup none|seed
    --settings none|json|database

  Electrobun feature options:
    --api electrobun-rpc|none
    --navigation local-only|none
    --native-utils none|file-dialogs
    --window-style native|hidden-inset
    --app-menu edit|none
    --build-env dev|canary|stable
    --build-targets current|all

  Tooling and output:
    --package-manager bun|npm|pnpm|yarn
    --testing bun|none
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
    --help

Add command:
  create-electrobun-stack add [stack options]
  Reads ces.json from the current directory, or from --cwd <project-directory>,
  and enables missing stack features without accepting a project name.

Interactive mode asks for omitted stack choices when creating. Use --yes to accept defaults.`);
};

export const parseArgs = (args: Array<string>): CliOptions => {
  const command: CliCommand = args[0] === "add" ? "add" : "create";
  const startIndex = command === "add" ? 1 : 0;
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
  const stackFlags = new Set<StackOptionName>();

  for (let index = startIndex; index < args.length; index += 1) {
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
        stackFlags.add(stackFlagNames[rawFlag]);

        if (!inlineValue) {
          index += 1;
        }

        continue;
      }
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (command === "add") {
      throw new Error(
        `Unexpected argument for add: "${arg}". Use --cwd <project-directory> to choose the existing stack.`,
      );
    }

    if (projectName) {
      throw new Error(
        `Received multiple project names: "${projectName}" and "${arg}".`,
      );
    }

    projectName = arg;
  }

  if (stack.api === "none" && !stackFlags.has("examples")) {
    stack.examples = "none";
  }

  return {
    appIdentifier,
    command,
    cwd,
    dryRun,
    git: gitEnabled,
    help,
    install,
    listTemplates,
    projectName,
    stack,
    stackFlags,
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

const getDisplayPath = (targetDirectory: string): string => {
  const relativeTarget = relative(process.cwd(), targetDirectory);

  if (
    relativeTarget &&
    relativeTarget !== ".." &&
    !relativeTarget.startsWith(`..${sep}`) &&
    !isAbsolute(relativeTarget)
  ) {
    return relativeTarget;
  }

  return targetDirectory;
};

const formatCommandRows = (
  rows: Array<{ command: string; detail: string }>,
): Array<string> => {
  const commandWidth = Math.max(...rows.map((row) => row.command.length));

  return rows.map(
    (row) => `  ${row.command.padEnd(commandWidth)}  ${row.detail}`,
  );
};

const formatNextStepRows = (
  rows: Array<{ command: string; detail: string }>,
): Array<string> => {
  const commandWidth = Math.max(...rows.map((row) => row.command.length));

  return rows.map(
    (row, index) =>
      `${index + 1}. ${row.command.padEnd(commandWidth)}  ${row.detail}`,
  );
};

export const createFinalScreen = ({
  gitInitialized,
  installAttempted,
  installed,
  projectName,
  stack,
  targetDirectory,
}: {
  gitInitialized: boolean;
  installAttempted: boolean;
  installed: boolean;
  projectName: string;
  stack: StackOptions;
  targetDirectory: string;
}): Array<string> => {
  const installCommand = getInstallCommand(stack.packageManager);
  const devCommand = getRunCommand(stack.packageManager, "dev");
  const buildCommand = getRunCommand(stack.packageManager, "build");
  const checkCommand = getRunCommand(stack.packageManager, "check");
  const lintCommand = getRunCommand(stack.packageManager, "lint");
  const testCommand = getRunCommand(stack.packageManager, "test");
  const typecheckCommand = getRunCommand(stack.packageManager, "typecheck");
  const nextSteps = [
    {
      command: `cd ${getDisplayPath(targetDirectory)}`,
      detail: "Enter the project",
    },
    ...(installed
      ? []
      : [
          {
            command: installCommand,
            detail: installAttempted
              ? "Retry dependency install"
              : "Install dependencies",
          },
        ]),
    {
      command: devCommand,
      detail: "Start the Electrobun app",
    },
  ];
  const usefulCommands =
    stack.addons === "turborepo"
      ? [
          {
            command: checkCommand,
            detail:
              stack.testing === "bun"
                ? "Run typecheck, lint, and tests"
                : "Run typecheck and lint",
          },
          {
            command: buildCommand,
            detail: "Build the desktop app",
          },
        ]
      : [
          {
            command: typecheckCommand,
            detail: "Check TypeScript",
          },
          {
            command: lintCommand,
            detail: "Run Biome checks",
          },
          ...(stack.testing === "bun"
            ? [
                {
                  command: testCommand,
                  detail: "Run tests",
                },
              ]
            : []),
          {
            command: buildCommand,
            detail: "Build the desktop app",
          },
        ];

  return [
    `Project: ${projectName}`,
    installed
      ? "Dependencies: installed"
      : installAttempted
        ? "Dependencies: install needs a retry"
        : "Dependencies: install skipped",
    ...(gitInitialized ? ["Git: initialized"] : []),
    "",
    "Next steps:",
    ...formatNextStepRows(nextSteps),
    "",
    "Useful commands:",
    ...formatCommandRows(usefulCommands),
  ];
};

type StackChange = {
  from: string;
  name: StackOptionName;
  to: string;
};

const stackOptionNames = Object.keys(
  defaultStackOptions,
) as Array<StackOptionName>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readCesManifest = async (
  targetDirectory: string,
): Promise<CesManifest> => {
  const manifestPath = join(targetDirectory, "ces.json");
  const manifestFile = Bun.file(manifestPath);

  if (!(await manifestFile.exists())) {
    throw new Error(
      `Could not find ces.json in ${targetDirectory}. Run add inside an existing create-electrobun-stack project or pass --cwd <project-directory>.`,
    );
  }

  const manifest = (await manifestFile.json()) as unknown;

  if (!isRecord(manifest)) {
    throw new Error(`ces.json is not a valid manifest: ${manifestPath}`);
  }

  const hasRequiredStrings =
    typeof manifest.projectName === "string" &&
    typeof manifest.packageName === "string" &&
    typeof manifest.appIdentifier === "string" &&
    typeof manifest.template === "string" &&
    typeof manifest.createdAt === "string";

  if (
    !hasRequiredStrings ||
    !Array.isArray(manifest.addons) ||
    !Array.isArray(manifest.examples) ||
    !isRecord(manifest.features)
  ) {
    throw new Error(
      `ces.json is missing required stack metadata: ${manifestPath}`,
    );
  }

  return manifest as CesManifest;
};

const applyStackFlagOverrides = (
  target: StackOptions,
  source: StackOptions,
  flags: ReadonlySet<StackOptionName>,
): void => {
  for (const flag of flags) {
    target[flag] = source[flag] as never;
  }
};

const inferStackOption = <Name extends StackOptionName>(
  stack: StackOptions,
  requestedFlags: ReadonlySet<StackOptionName>,
  name: Name,
  value: StackOptions[Name],
  reason: string,
  inferredChanges: Array<string>,
): void => {
  if (requestedFlags.has(name) || stack[name] === value) {
    return;
  }

  const previousValue = stack[name];
  stack[name] = value;
  inferredChanges.push(`${name}: ${previousValue} -> ${value} (${reason})`);
};

const inferAddDependencies = (
  stack: StackOptions,
  requestedFlags: ReadonlySet<StackOptionName>,
): Array<string> => {
  const inferredChanges: Array<string> = [];

  if (stack.orm === "drizzle") {
    inferStackOption(
      stack,
      requestedFlags,
      "database",
      "sqlite",
      "Drizzle requires SQLite",
      inferredChanges,
    );
  }

  if (stack.dbSetup === "seed") {
    inferStackOption(
      stack,
      requestedFlags,
      "database",
      "sqlite",
      "seed data requires SQLite",
      inferredChanges,
    );
  }

  if (stack.settings === "database") {
    inferStackOption(
      stack,
      requestedFlags,
      "database",
      "sqlite",
      "database-backed settings require SQLite",
      inferredChanges,
    );
  }

  if (stack.settings !== "none" || stack.examples === "rpc") {
    inferStackOption(
      stack,
      requestedFlags,
      "api",
      "electrobun-rpc",
      "RPC-backed features require Electrobun RPC",
      inferredChanges,
    );
  }

  if (stack.nativeUtils !== "none") {
    inferStackOption(
      stack,
      requestedFlags,
      "api",
      "electrobun-rpc",
      "native utility examples require Electrobun RPC",
      inferredChanges,
    );
  }

  if (stack.ui === "shadcn") {
    inferStackOption(
      stack,
      requestedFlags,
      "styling",
      "tailwindcss",
      "shadcn/ui requires Tailwind CSS",
      inferredChanges,
    );
  }

  return inferredChanges;
};

const createStackChanges = (
  currentStack: StackOptions,
  nextStack: StackOptions,
): Array<StackChange> =>
  stackOptionNames.flatMap((name) =>
    currentStack[name] === nextStack[name]
      ? []
      : [
          {
            from: String(currentStack[name]),
            name,
            to: String(nextStack[name]),
          },
        ],
  );

const isAdditiveStackChange = (change: StackChange): boolean => {
  switch (change.name) {
    case "addons":
      return change.from === "none" && change.to === "turborepo";
    case "api":
      return change.from === "none" && change.to === "electrobun-rpc";
    case "appMenu":
      return change.from === "none" && change.to === "edit";
    case "auth":
      return change.from === "none" && change.to === "app-lock";
    case "database":
      return change.from === "none" && change.to === "sqlite";
    case "dbSetup":
      return change.from === "none" && change.to === "seed";
    case "examples":
      return change.from === "none" && change.to === "rpc";
    case "navigation":
      return change.from === "none" && change.to === "local-only";
    case "nativeUtils":
      return change.from === "none" && change.to === "file-dialogs";
    case "orm":
      return change.from === "none" && change.to === "drizzle";
    case "settings":
      return (
        change.from === "none" &&
        (change.to === "json" || change.to === "database")
      );
    case "styling":
      return change.from === "css" && change.to === "tailwindcss";
    case "testing":
      return change.from === "none" && change.to === "bun";
    case "ui":
      return change.from === "none" && change.to === "shadcn";
    case "windowStyle":
      return change.from === "native" && change.to === "hidden-inset";
    case "query":
      return change.from === "none" && change.to === "tanstack-query";
    case "router":
      return (
        change.from === "none" &&
        (change.to === "tanstack-router" || change.to === "react-router")
      );
    case "buildEnv":
    case "buildTargets":
    case "frontend":
    case "packageManager":
    case "runtime":
      return false;
  }
};

const formatStackChange = (change: StackChange): string =>
  `${change.name}: ${change.from} -> ${change.to}`;

const assertAdditiveStackChanges = (changes: Array<StackChange>): void => {
  const unsupported = changes.filter(
    (change) => !isAdditiveStackChange(change),
  );

  if (unsupported.length === 0) {
    return;
  }

  throw new Error(
    [
      "The add command can only enable missing stack features.",
      "Unsupported changes:",
      ...unsupported.map((change) => `  ${formatStackChange(change)}`),
    ].join("\n"),
  );
};

const createAddFinalScreen = ({
  changes,
  installAttempted,
  installed,
  projectName,
  stack,
  targetDirectory,
}: {
  changes: Array<StackChange>;
  installAttempted: boolean;
  installed: boolean;
  projectName: string;
  stack: StackOptions;
  targetDirectory: string;
}): Array<string> => {
  const installCommand = getInstallCommand(stack.packageManager);
  const devCommand = getRunCommand(stack.packageManager, "dev");
  const nextSteps = [
    {
      command: `cd ${getDisplayPath(targetDirectory)}`,
      detail: "Enter the project",
    },
    ...(installed
      ? []
      : [
          {
            command: installCommand,
            detail: installAttempted
              ? "Retry dependency install"
              : "Install dependencies",
          },
        ]),
    {
      command: devCommand,
      detail: "Start the Electrobun app",
    },
  ];

  return [
    `Project: ${projectName}`,
    "ces.json: updated",
    installed
      ? "Dependencies: installed"
      : installAttempted
        ? "Dependencies: install needs a retry"
        : "Dependencies: install skipped",
    "",
    "Added:",
    ...changes.map((change) => `  ${formatStackChange(change)}`),
    "",
    "Next steps:",
    ...formatNextStepRows(nextSteps),
  ];
};

const runAddCommand = async (options: CliOptions): Promise<void> => {
  if (options.stackFlags.size === 0) {
    throw new Error("Choose at least one stack option to add.");
  }

  const targetDirectory = resolve(options.cwd);

  intro("create-electrobun-stack add");

  const manifest = await readCesManifest(targetDirectory);
  const currentStack = stackOptionsFromCesManifest(manifest);

  validateStackOptions(currentStack);

  const stack: StackOptions = { ...currentStack };
  applyStackFlagOverrides(stack, options.stack, options.stackFlags);
  const inferredChanges = inferAddDependencies(stack, options.stackFlags);

  validateStackOptions(stack);

  const changes = createStackChanges(currentStack, stack);

  if (changes.length === 0) {
    note(
      [
        `Project: ${manifest.projectName}`,
        `Manifest: ${join(targetDirectory, "ces.json")}`,
        "Requested stack options are already present.",
      ].join("\n"),
      "Resolved add",
    );
    outro("No changes.");
    return;
  }

  assertAdditiveStackChanges(changes);

  note(
    [
      `Project: ${manifest.projectName}`,
      `Manifest: ${join(targetDirectory, "ces.json")}`,
      "Additions:",
      ...changes.map((change) => `  ${formatStackChange(change)}`),
      ...(inferredChanges.length > 0
        ? [
            "Inferred prerequisites:",
            ...inferredChanges.map((item) => `  ${item}`),
          ]
        : []),
      `Install: ${options.install ? "yes" : "no"}`,
    ].join("\n"),
    "Resolved add",
  );

  if (options.dryRun) {
    logger.box([
      "Dry run:",
      `target: ${targetDirectory}`,
      "additions:",
      ...changes.map((change) => `  ${formatStackChange(change)}`),
      "No files were written.",
    ]);
    outro("No files were written.");
    return;
  }

  await runStep("Adding stack options", () =>
    addToProject({
      install: options.install,
      manifest,
      stack,
      targetDirectory,
    }),
  );

  logger.success(`Updated ${manifest.projectName} from ces.json.`);

  let installed = false;
  const installCommand = getInstallCommand(stack.packageManager);

  if (options.install) {
    try {
      await runStep(
        `Installing dependencies with ${stack.packageManager}`,
        () => packageManager.install(targetDirectory, stack.packageManager),
      );
      installed = true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn(`Dependency install failed: ${message}`);
      logger.info(
        `Stack files were updated. Run ${installCommand} inside the project when ready.`,
      );
    }
  }

  logger.box(
    createAddFinalScreen({
      changes,
      installAttempted: options.install,
      installed,
      projectName: manifest.projectName,
      stack,
      targetDirectory,
    }),
  );
  outro("Ready.");
};

export const runCli = async (args: Array<string>): Promise<void> => {
  try {
    const options = parseArgs(args);

    if (options.version) {
      logger.info(await getPackageVersion());
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

    if (options.command === "add") {
      await runAddCommand(options);
      return;
    }

    if (!options.projectName && options.yes) {
      throw new Error("Project name is required when using --yes.");
    }

    if (!options.projectName && !process.stdin.isTTY) {
      throw new Error("Project name is required in non-interactive mode.");
    }

    const shouldPrompt = !options.yes && process.stdin.isTTY;

    if (shouldPrompt) {
      intro("create-electrobun-stack");
    }

    const projectName = options.projectName ?? (await promptProjectName());
    const validation = validateProjectName(projectName);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const template =
      options.template ??
      (shouldPrompt ? await promptTemplate(defaultTemplate) : defaultTemplate);
    const stack = shouldPrompt
      ? await promptStackOptions(options.stack, options.stackFlags)
      : options.stack;
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

    if (!shouldPrompt) {
      intro("create-electrobun-stack");
    }

    note(
      [
        `Project: ${projectName}`,
        `Template: ${template}`,
        `Package manager: ${stack.packageManager}`,
        "Stack:",
        ...formatStackOptions(stack).map((item) => `  ${item}`),
        `Install: ${options.install ? "yes" : "no"}`,
        `Git: ${options.git ? "yes" : "no"}`,
      ].join("\n"),
      "Resolved stack",
    );

    if (options.dryRun) {
      const unsupported = getUnsupportedStackOptions(stack);

      logger.box([
        "Dry run:",
        `target: ${targetDirectory}`,
        `package: ${packageName}`,
        `identifier: ${appIdentifier}`,
        "stack:",
        ...formatStackOptions(stack).map((item) => `  ${item}`),
        unsupported.length > 0
          ? `invalid: ${unsupported.map((item) => item.flag).join(", ")}`
          : "invalid: none",
      ]);
      outro("No files were written.");
      return;
    }

    validateStackOptions(stack);

    await runStep("Scaffolding files", () =>
      scaffoldProject({
        appIdentifier,
        git: options.git,
        install: options.install,
        packageName,
        projectName,
        stack,
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
    const installCommand = getInstallCommand(stack.packageManager);

    if (options.install) {
      try {
        await runStep(
          `Installing dependencies with ${stack.packageManager}`,
          () => packageManager.install(targetDirectory, stack.packageManager),
        );
        installed = true;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        logger.warn(`Dependency install failed: ${message}`);
        logger.info(
          `The project was created. Run ${installCommand} inside it when ready.`,
        );
      }
    }

    logger.box(
      createFinalScreen({
        gitInitialized: options.git,
        installAttempted: options.install,
        installed,
        projectName,
        stack,
        targetDirectory,
      }),
    );
    outro("Ready.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(message);
    process.exitCode = 1;
  }
};
