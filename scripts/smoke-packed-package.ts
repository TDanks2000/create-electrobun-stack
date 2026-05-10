import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

type PackageJson = {
  version: string;
};

type CesManifest = {
  $schema: string;
  packageName: string;
  version: string;
};

const repoRoot = dirname(
  fileURLToPath(new URL("../package.json", import.meta.url)),
);
const keepOutput = process.argv.includes("--keep");

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

const runBin = (
  binPath: string,
  args: Array<string>,
  cwd: string,
  label: string,
): Promise<CommandResult> => {
  if (process.platform === "win32") {
    return runCommand({
      args: ["/c", binPath, ...args],
      command: "cmd",
      cwd,
      label,
    });
  }

  return runCommand({
    args,
    command: binPath,
    cwd,
    label,
  });
};

const readJson = async <Value>(path: string): Promise<Value> =>
  JSON.parse(await readFile(path, "utf8")) as Value;

const findPackedTarball = (packOutput: string): string => {
  const tarballName = packOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .findLast((line) => line.endsWith(".tgz"));

  if (!tarballName) {
    throw new Error(
      `Could not find packed tarball in npm output:\n${packOutput}`,
    );
  }

  return tarballName;
};

const assertPathExists = async (path: string): Promise<void> => {
  await stat(path);
};

const main = async (): Promise<void> => {
  const root = await mkdtemp(join(tmpdir(), "create-electrobun-stack-pack-"));
  const consumerRoot = join(root, "consumer");
  const packageJson = await readJson<PackageJson>(
    join(repoRoot, "package.json"),
  );

  try {
    await mkdir(consumerRoot, { recursive: true });
    await writeFile(
      join(consumerRoot, "package.json"),
      `${JSON.stringify({ name: "consumer", private: true }, null, 2)}\n`,
    );

    const packResult = await runCommand({
      args: ["pack", "--pack-destination", root],
      command: "npm",
      cwd: repoRoot,
      label: "npm pack",
    });
    const tarballPath = join(root, findPackedTarball(packResult.stdout));

    await assertPathExists(tarballPath);

    await runCommand({
      args: [
        "install",
        "--no-audit",
        "--no-fund",
        "--ignore-scripts",
        tarballPath,
      ],
      command: "npm",
      cwd: consumerRoot,
      label: "npm install packed tarball",
    });

    const binPath =
      process.platform === "win32"
        ? join(
            consumerRoot,
            "node_modules",
            ".bin",
            "create-electrobun-stack.cmd",
          )
        : join(consumerRoot, "node_modules", ".bin", "create-electrobun-stack");

    const versionResult = await runBin(
      binPath,
      ["--version"],
      consumerRoot,
      "packed CLI --version",
    );
    const reportedVersion = versionResult.stdout.trim();

    if (reportedVersion !== packageJson.version) {
      throw new Error(
        `Packed CLI reported ${reportedVersion}; expected ${packageJson.version}.`,
      );
    }

    const dryRunProject = join(consumerRoot, "dry-run-app");
    const dryRunResult = await runBin(
      binPath,
      ["dry-run-app", "--dry-run", "--yes", "--cwd", consumerRoot],
      consumerRoot,
      "packed CLI dry-run",
    );

    if (!dryRunResult.stdout.includes("No files were written.")) {
      throw new Error("Packed CLI dry-run did not report no-write behavior.");
    }

    try {
      await stat(dryRunProject);
      throw new Error("Packed CLI dry-run created the target directory.");
    } catch (error: unknown) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }

    await runBin(
      binPath,
      ["packed-app", "--yes", "--no-install", "--cwd", consumerRoot],
      consumerRoot,
      "packed CLI scaffold",
    );

    const generatedRoot = join(consumerRoot, "packed-app");
    const manifest = await readJson<CesManifest>(
      join(generatedRoot, "ces.json"),
    );

    await assertPathExists(join(generatedRoot, "package.json"));
    await assertPathExists(join(generatedRoot, "README.md"));
    await assertPathExists(join(generatedRoot, "src", "bun", "index.ts"));

    if (manifest.version !== packageJson.version) {
      throw new Error(
        `Generated manifest version ${manifest.version}; expected ${packageJson.version}.`,
      );
    }

    if (!manifest.$schema.includes(`@${packageJson.version}/`)) {
      throw new Error(
        `Generated manifest schema does not include ${packageJson.version}.`,
      );
    }

    if (manifest.packageName !== "packed-app") {
      throw new Error(
        `Generated manifest packageName ${manifest.packageName}; expected packed-app.`,
      );
    }

    console.log("packed-package smoke test passed");
  } finally {
    if (keepOutput) {
      console.log(`kept smoke test files at ${root}`);
    } else {
      await rm(root, { force: true, recursive: true });
    }
  }
};

await main();
