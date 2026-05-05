import { join, relative } from "node:path";

type CopyTemplateOptions = {
  replacements: Record<string, string>;
  sourceDirectory: string;
  targetDirectory: string;
};

const textExtensions = new Set([
  ".css",
  ".html",
  ".json",
  ".md",
  ".ts",
  ".tsx",
]);

const getExtension = (path: string): string => {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
};

const replacePlaceholders = (
  value: string,
  replacements: Record<string, string>,
): string => {
  let result = value;

  for (const [placeholder, replacement] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, replacement);
  }

  return result;
};

const copyFile = async (
  source: string,
  target: string,
  replacements: Record<string, string>,
): Promise<void> => {
  const extension = getExtension(source);

  if (textExtensions.has(extension)) {
    const content = await Bun.file(source).text();
    await Bun.write(target, replacePlaceholders(content, replacements));
    return;
  }

  await Bun.write(target, Bun.file(source));
};

export const copyTemplate = async ({
  replacements,
  sourceDirectory,
  targetDirectory,
}: CopyTemplateOptions): Promise<void> => {
  const glob = new Bun.Glob("**/*");

  await Bun.$`mkdir -p ${targetDirectory}`.quiet();

  for await (const entry of glob.scan({
    cwd: sourceDirectory,
    dot: true,
    onlyFiles: false,
  })) {
    const source = join(sourceDirectory, entry);
    const target = join(
      targetDirectory,
      replacePlaceholders(relative(sourceDirectory, source), replacements),
    );
    const stat = await Bun.file(source).stat();

    if (stat.isDirectory()) {
      await Bun.$`mkdir -p ${target}`.quiet();
      continue;
    }

    await Bun.$`mkdir -p ${join(target, "..")}`.quiet();
    await copyFile(source, target, replacements);
  }
};
