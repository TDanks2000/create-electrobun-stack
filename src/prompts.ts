import type { Option } from "@clack/prompts";
import { cancel, isCancel, multiselect, select, text } from "@clack/prompts";
import type { StackOptionName, StackOptions } from "./options";
import type { TemplateName } from "./scaffold";

const handleCancel = <Value>(answer: Value | symbol): Value => {
  if (isCancel(answer)) {
    cancel("Scaffold cancelled.");
    process.exit(0);
  }

  return answer;
};

const templateChoices = [
  { value: "minimal", label: "Minimal", hint: "implemented" },
  { value: "standard", label: "Standard", hint: "planned", disabled: true },
  { value: "full", label: "Full", hint: "planned", disabled: true },
] satisfies Array<Option<TemplateName>>;

export const promptProjectName = async (): Promise<string> => {
  const answer = await text({
    message: "Project name",
    placeholder: "my-electrobun-app",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Project name is required.";
      }

      return undefined;
    },
  });

  return handleCancel(answer).trim();
};

export const promptTemplate = async (
  initialValue: TemplateName,
): Promise<TemplateName> => {
  const answer = await select({
    initialValue,
    message: "Template",
    options: templateChoices,
  });

  return handleCancel(answer);
};

const promptStackSelect = async <Name extends StackOptionName>(
  options: StackOptions,
  lockedOptions: ReadonlySet<StackOptionName>,
  name: Name,
  message: string,
  choices: Array<Option<StackOptions[Name]>>,
): Promise<void> => {
  if (lockedOptions.has(name)) {
    return;
  }

  const answer = await select({
    initialValue: options[name],
    message,
    options: choices,
  });

  options[name] = handleCancel(answer);
};

const promptAddons = async (
  options: StackOptions,
  lockedOptions: ReadonlySet<StackOptionName>,
): Promise<void> => {
  if (lockedOptions.has("addons")) {
    return;
  }

  const answer = await multiselect({
    initialValues: options.addons === "turborepo" ? ["turborepo"] : [],
    message: "Add-ons",
    options: [
      {
        value: "turborepo",
        label: "Turborepo",
        hint: "planned",
        disabled: true,
      },
    ],
    required: false,
  });

  options.addons = handleCancel(answer).includes("turborepo")
    ? "turborepo"
    : "none";
};

const promptExamples = async (
  options: StackOptions,
  lockedOptions: ReadonlySet<StackOptionName>,
): Promise<void> => {
  if (lockedOptions.has("examples")) {
    return;
  }

  const answer = await multiselect({
    initialValues:
      options.examples === "rpc" && options.api === "electrobun-rpc"
        ? ["rpc"]
        : [],
    message: "Examples",
    options: [
      {
        value: "rpc",
        label: "RPC example",
        hint:
          options.api === "electrobun-rpc"
            ? "recommended"
            : "requires Electrobun RPC",
        disabled: options.api !== "electrobun-rpc",
      },
    ],
    required: false,
  });

  options.examples = handleCancel(answer).includes("rpc") ? "rpc" : "none";
};

export const promptStackOptions = async (
  initialOptions: StackOptions,
  lockedOptions: ReadonlySet<StackOptionName>,
): Promise<StackOptions> => {
  const options: StackOptions = { ...initialOptions };

  await promptStackSelect(options, lockedOptions, "frontend", "Frontend", [
    { value: "react", label: "React WebView", hint: "implemented" },
    { value: "next", label: "Next.js", hint: "planned", disabled: true },
    {
      value: "none",
      label: "None",
      hint: "desktop app needs a renderer",
      disabled: true,
    },
  ]);

  await promptStackSelect(options, lockedOptions, "api", "API layer", [
    {
      value: "electrobun-rpc",
      label: "Electrobun RPC",
      hint: "implemented",
    },
    { value: "trpc", label: "tRPC", hint: "planned", disabled: true },
    {
      value: "none",
      label: "None",
      hint: "minimal template expects typed RPC",
      disabled: true,
    },
  ]);

  await promptStackSelect(options, lockedOptions, "styling", "Styling", [
    { value: "tailwindcss", label: "Tailwind CSS", hint: "implemented" },
    { value: "css", label: "Plain CSS", hint: "no Tailwind dependency" },
  ]);

  await promptStackSelect(options, lockedOptions, "ui", "UI components", [
    { value: "none", label: "None", hint: "minimal" },
    {
      value: "shadcn",
      label: "shadcn/ui config",
      hint:
        options.styling === "tailwindcss"
          ? "components.json"
          : "requires Tailwind CSS",
      disabled: options.styling !== "tailwindcss",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "database", "Database", [
    { value: "none", label: "None", hint: "implemented" },
    { value: "sqlite", label: "SQLite", hint: "Bun native SQLite" },
  ]);

  await promptStackSelect(options, lockedOptions, "orm", "ORM", [
    { value: "none", label: "None", hint: "implemented" },
    {
      value: "drizzle",
      label: "Drizzle",
      hint:
        options.database === "sqlite"
          ? "implemented"
          : "requires SQLite database",
      disabled: options.database !== "sqlite",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "auth", "Auth", [
    { value: "none", label: "None", hint: "implemented" },
    {
      value: "better-auth",
      label: "Better Auth",
      hint: options.database === "sqlite" ? "planned" : "requires a database",
      disabled: true,
    },
  ]);

  await promptAddons(options, lockedOptions);
  await promptExamples(options, lockedOptions);

  return options;
};
