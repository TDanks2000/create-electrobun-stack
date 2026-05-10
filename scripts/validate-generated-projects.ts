import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultStackOptions,
  type StackOptions,
  validateStackOptions,
} from "../src/options";
import { scaffoldProject } from "../src/scaffold";

type ValidationCase = {
  name: string;
  stack: StackOptions;
};

type CommandOptions = {
  args: Array<string>;
  command: string;
  cwd: string;
  label: string;
};

type CommandResult = {
  stderr: string;
  stdout: string;
};

const repoRoot = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const runFullValidation = process.argv.includes("--full");
const keepOutput = process.argv.includes("--keep");

const biomeBin =
  process.platform === "win32"
    ? join(repoRoot, "node_modules", ".bin", "biome.cmd")
    : join(repoRoot, "node_modules", ".bin", "biome");

const validationCases = [
  {
    name: "default-stack",
    stack: { ...defaultStackOptions },
  },
  {
    name: "react-router-query",
    stack: {
      ...defaultStackOptions,
      query: "tanstack-query",
      router: "react-router",
    },
  },
  {
    name: "static-css-no-examples",
    stack: {
      ...defaultStackOptions,
      api: "none",
      appMenu: "none",
      examples: "none",
      navigation: "none",
      router: "none",
      styling: "css",
      testing: "none",
    },
  },
  {
    name: "sqlite-drizzle-settings",
    stack: {
      ...defaultStackOptions,
      database: "sqlite",
      dbSetup: "seed",
      orm: "drizzle",
      settings: "database",
    },
  },
  {
    name: "native-window-auth",
    stack: {
      ...defaultStackOptions,
      auth: "app-lock",
      nativeUtils: "file-dialogs",
      windowStyle: "hidden-inset",
    },
  },
  {
    name: "turborepo-build-targets",
    stack: {
      ...defaultStackOptions,
      addons: "turborepo",
      buildEnv: "stable",
      buildTargets: "all",
    },
  },
  {
    name: "shadcn-ui",
    stack: {
      ...defaultStackOptions,
      ui: "shadcn",
    },
  },
] satisfies Array<ValidationCase>;

const runCommand = ({
  args,
  command,
  cwd,
  label,
}: CommandOptions): Promise<CommandResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Array<Buffer> = [];
    const stderr: Array<Buffer> = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout.push(chunk);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const result = {
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdout: Buffer.concat(stdout).toString("utf8"),
      };

      if (code === 0) {
        resolve(result);
        return;
      }

      reject(
        new Error(
          [
            `${label} failed with exit code ${code ?? "unknown"}.`,
            result.stdout.trim(),
            result.stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });

const runGeneratedCommand = (
  label: string,
  args: Array<string>,
  cwd: string,
): Promise<CommandResult> =>
  runCommand({
    args,
    command: "bun",
    cwd,
    label,
  });

const scaffoldValidationCase = async (
  root: string,
  validationCase: ValidationCase,
): Promise<string> => {
  const projectName = validationCase.name;
  const targetDirectory = join(root, projectName);

  validateStackOptions(validationCase.stack);

  await scaffoldProject({
    appIdentifier: `dev.electrobun.${projectName.replaceAll("-", "")}`,
    install: false,
    git: false,
    packageName: projectName,
    projectName,
    stack: validationCase.stack,
    targetDirectory,
    template: "minimal",
  });

  return targetDirectory;
};

const validateRenderedProject = async (
  validationCase: ValidationCase,
  targetDirectory: string,
): Promise<void> => {
  await runCommand({
    args: ["check", "."],
    command: biomeBin,
    cwd: targetDirectory,
    label: `${validationCase.name}: biome check`,
  });
};

const validateInstalledProject = async (
  validationCase: ValidationCase,
  targetDirectory: string,
): Promise<void> => {
  await runGeneratedCommand(
    `${validationCase.name}: bun install`,
    ["install"],
    targetDirectory,
  );
  await runGeneratedCommand(
    `${validationCase.name}: typecheck`,
    ["run", "typecheck"],
    targetDirectory,
  );
  await runGeneratedCommand(
    `${validationCase.name}: lint`,
    ["run", "lint"],
    targetDirectory,
  );

  if (validationCase.stack.testing === "bun") {
    await runGeneratedCommand(
      `${validationCase.name}: test`,
      ["test"],
      targetDirectory,
    );
  }

  await runGeneratedCommand(
    `${validationCase.name}: build`,
    ["run", "build"],
    targetDirectory,
  );
};

const main = async (): Promise<void> => {
  const root = await mkdtemp(join(tmpdir(), "create-electrobun-stack-"));
  await mkdir(root, { recursive: true });

  try {
    for (const validationCase of validationCases) {
      const targetDirectory = await scaffoldValidationCase(
        root,
        validationCase,
      );

      console.log(`validating ${validationCase.name}`);
      await validateRenderedProject(validationCase, targetDirectory);

      if (runFullValidation) {
        await validateInstalledProject(validationCase, targetDirectory);
      }
    }

    console.log(
      runFullValidation
        ? "generated-project validation passed"
        : "generated-project render validation passed",
    );
  } finally {
    if (keepOutput) {
      console.log(`kept generated projects at ${root}`);
    } else {
      await rm(root, { force: true, recursive: true });
    }
  }
};

await main();
