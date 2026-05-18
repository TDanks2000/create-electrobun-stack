import {
  copyFile as copyStaticFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import Handlebars from "handlebars";
import { collapseStringArrays } from "./json-format";

type CopyTemplateOptions = {
  replacements: Record<string, string>;
  sourceDirectory: string;
  targetDirectory: string;
  templateData?: Record<string, unknown>;
};

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".svelte",
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

  if (source.endsWith(".css") || source.endsWith(".css.hbs")) {
    return result.replace(/\n{3,}/g, "\n\n").replace(/\n*$/, "\n");
  }

  if (!source.endsWith("biome.json") && !source.endsWith("biome.json.hbs")) {
    return result;
  }

  const parsed: unknown = JSON.parse(result);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const config = parsed as Record<string, unknown>;

    if ("root" in config) {
      config.root = true;
    }

    return `${collapseStringArrays(JSON.stringify(config, null, 2))}\n`;
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
    const content = await readFile(source, "utf8");
    await writeFile(
      target,
      prepareTextContent(source, content, replacements, templateData),
    );
    return;
  }

  await copyStaticFile(source, target);
};

async function* walkDirectory(directory: string): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);

    yield path;

    if (entry.isDirectory()) {
      yield* walkDirectory(path);
    }
  }
}

export const copyTemplate = async ({
  replacements,
  sourceDirectory,
  targetDirectory,
  templateData = {},
}: CopyTemplateOptions): Promise<void> => {
  await mkdir(targetDirectory, { recursive: true });

  for await (const source of walkDirectory(sourceDirectory)) {
    const relativeTarget = replacePlaceholders(
      relative(sourceDirectory, source),
      replacements,
    ).replace(/\.hbs$/, "");
    const target = join(targetDirectory, relativeTarget);
    const sourceStat = await stat(source);

    if (sourceStat.isDirectory()) {
      await mkdir(target, { recursive: true });
      continue;
    }

    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target, replacements, templateData);
  }
};
