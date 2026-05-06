import { join, relative } from "node:path";
import Handlebars from "handlebars";

type CopyTemplateOptions = {
  replacements: Record<string, string>;
  sourceDirectory: string;
  targetDirectory: string;
  templateData?: Record<string, unknown>;
};

const textExtensions = new Set([
  ".css",
  ".html",
  ".json",
  ".md",
  ".ts",
  ".tsx",
  ".hbs",
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

const prepareTextContent = (
  source: string,
  content: string,
  replacements: Record<string, string>,
  templateData: Record<string, unknown>,
): string => {
  const templateResult = source.endsWith(".hbs")
    ? Handlebars.compile(content, { noEscape: true })(templateData)
    : content;
  const result = replacePlaceholders(templateResult, replacements);

  if (!source.endsWith("biome.json") && !source.endsWith("biome.json.hbs")) {
    return result;
  }

  const parsed: unknown = JSON.parse(result);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const config = parsed as Record<string, unknown>;

    if ("root" in config) {
      config.root = true;
    }

    return `${JSON.stringify(config, null, 2)}\n`;
  }

  return result;
};

const copyFile = async (
  source: string,
  target: string,
  replacements: Record<string, string>,
  templateData: Record<string, unknown>,
): Promise<void> => {
  const extension = getExtension(source);

  if (textExtensions.has(extension)) {
    const content = await Bun.file(source).text();
    await Bun.write(
      target,
      prepareTextContent(source, content, replacements, templateData),
    );
    return;
  }

  await Bun.write(target, Bun.file(source));
};

export const copyTemplate = async ({
  replacements,
  sourceDirectory,
  targetDirectory,
  templateData = {},
}: CopyTemplateOptions): Promise<void> => {
  const glob = new Bun.Glob("**/*");

  await Bun.$`mkdir -p ${targetDirectory}`.quiet();

  for await (const entry of glob.scan({
    cwd: sourceDirectory,
    dot: true,
    onlyFiles: false,
  })) {
    const source = join(sourceDirectory, entry);
    const relativeTarget = replacePlaceholders(
      relative(sourceDirectory, source),
      replacements,
    ).replace(/\.hbs$/, "");
    const target = join(targetDirectory, relativeTarget);
    const stat = await Bun.file(source).stat();

    if (stat.isDirectory()) {
      await Bun.$`mkdir -p ${target}`.quiet();
      continue;
    }

    await Bun.$`mkdir -p ${join(target, "..")}`.quiet();
    await copyFile(source, target, replacements, templateData);
  }
};
