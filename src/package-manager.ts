import { spawn } from "node:child_process";
import type { StackOptions } from "./options";

type PackageManagerName = StackOptions["packageManager"];

const packageManagerSpecs = {
  bun: "bun@1.3.0",
  npm: "npm@10.9.0",
  pnpm: "pnpm@9.15.4",
  yarn: "yarn@1.22.22",
} as const satisfies Record<PackageManagerName, string>;

export const getPackageManagerSpec = (manager: PackageManagerName): string =>
  packageManagerSpecs[manager];

export const getInstallCommand = (manager: PackageManagerName): string =>
  `${manager} install`;

export const getRunCommand = (
  manager: PackageManagerName,
  script: string,
): string => {
  if (manager === "bun") {
    return script === "test" ? "bun test" : `bun run ${script}`;
  }

  if (manager === "npm") {
    return `npm run ${script}`;
  }

  return `${manager} ${script}`;
};

const runCommand = (
  command: string,
  args: Array<string>,
  cwd: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output: Array<string> = [];

    child.stdout?.on("data", (chunk: Buffer) => {
      output.push(chunk.toString("utf8"));
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      output.push(chunk.toString("utf8"));
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          [
            `${command} ${args.join(" ")} failed with exit code ${
              code ?? "unknown"
            }`,
            output.join("").trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });

export const packageManager = {
  install: (cwd: string, manager: PackageManagerName): Promise<void> => {
    switch (manager) {
      case "bun":
        return runCommand("bun", ["install"], cwd);
      case "npm":
        return runCommand("npm", ["install"], cwd);
      case "pnpm":
        return runCommand("pnpm", ["install"], cwd);
      case "yarn":
        return runCommand("yarn", ["install"], cwd);
    }
  },
};

export const git = {
  init: (cwd: string): Promise<void> => runCommand("git", ["init"], cwd),
};
