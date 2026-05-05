import { spawn } from "node:child_process";

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
  install: (cwd: string): Promise<void> => runCommand("bun", ["install"], cwd),
};

export const git = {
  init: (cwd: string): Promise<void> => runCommand("git", ["init"], cwd),
};
