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
  {
    value: "minimal",
    label: "Minimal",
    hint: "small Electrobun + React starter",
  },
  {
    value: "standard",
    label: "Standard",
    hint: "standard profile using the stable scaffold",
  },
  {
    value: "full",
    label: "Full",
    hint: "full profile using the stable scaffold",
  },
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
        hint: "adds turbo.json and Turbo scripts",
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
            ? "adds greeting and logging demo calls"
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
    {
      value: "react",
      label: "React WebView",
      hint: "generates the renderer view with React",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "api", "API layer", [
    {
      value: "electrobun-rpc",
      label: "Electrobun RPC",
      hint: "adds typed Bun-to-WebView calls",
    },
    {
      value: "none",
      label: "None",
      hint: "omits the native RPC bridge",
    },
  ]);

  await promptStackSelect(
    options,
    lockedOptions,
    "navigation",
    "Navigation guard",
    [
      {
        value: "local-only",
        label: "Local views only",
        hint: "blocks navigation outside bundled views",
      },
      {
        value: "none",
        label: "None",
        hint: "does not install a navigation guard",
      },
    ],
  );

  await promptStackSelect(
    options,
    lockedOptions,
    "windowStyle",
    "Window style",
    [
      {
        value: "native",
        label: "Native chrome",
        hint: "uses the default OS titlebar",
      },
      {
        value: "hidden-inset",
        label: "Hidden inset titlebar",
        hint: "adds hiddenInset titlebar and draggable header",
      },
    ],
  );

  await promptStackSelect(
    options,
    lockedOptions,
    "appMenu",
    "Application menu",
    [
      {
        value: "edit",
        label: "Edit menu",
        hint: "adds native copy, paste, and undo roles",
      },
      {
        value: "none",
        label: "None",
        hint: "omits the application menu scaffold",
      },
    ],
  );

  await promptStackSelect(options, lockedOptions, "styling", "Styling", [
    {
      value: "tailwindcss",
      label: "Tailwind CSS",
      hint: "adds Tailwind CSS v4 styling setup",
    },
    {
      value: "css",
      label: "Plain CSS",
      hint: "uses plain styles without Tailwind",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "ui", "UI components", [
    {
      value: "none",
      label: "None",
      hint: "does not add a component library config",
    },
    {
      value: "shadcn",
      label: "shadcn/ui config",
      hint:
        options.styling === "tailwindcss"
          ? "adds components.json for shadcn/ui"
          : "requires Tailwind CSS",
      disabled: options.styling !== "tailwindcss",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "database", "Database", [
    {
      value: "none",
      label: "None",
      hint: "does not add database files",
    },
    {
      value: "sqlite",
      label: "SQLite",
      hint: "adds a Bun SQLite client",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "orm", "ORM", [
    {
      value: "none",
      label: "None",
      hint: "uses the raw database client",
    },
    {
      value: "drizzle",
      label: "Drizzle",
      hint:
        options.database === "sqlite"
          ? "adds schema and Drizzle client files"
          : "requires SQLite database",
      disabled: options.database !== "sqlite",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "settings", "Settings", [
    {
      value: "none",
      label: "None",
      hint: "does not add settings persistence",
    },
    {
      value: "json",
      label: "JSON",
      hint:
        options.api === "electrobun-rpc"
          ? "adds a VS Code-style settings.json store"
          : "requires Electrobun RPC",
      disabled: options.api !== "electrobun-rpc",
    },
    {
      value: "database",
      label: "Database",
      hint:
        options.api !== "electrobun-rpc"
          ? "requires Electrobun RPC"
          : options.database === "sqlite"
            ? "stores settings in SQLite"
            : "requires SQLite database",
      disabled: options.api !== "electrobun-rpc" || options.database !== "sqlite",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "auth", "Auth", [
    {
      value: "none",
      label: "None",
      hint: "does not add an app lock screen",
    },
    {
      value: "app-lock",
      label: "App lock",
      hint: "adds a local unlock screen",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "dbSetup", "Database setup", [
    {
      value: "none",
      label: "None",
      hint: "leaves SQLite without seed data",
    },
    {
      value: "seed",
      label: "Seed data",
      hint:
        options.database === "sqlite"
          ? "adds a starter metadata row"
          : "requires SQLite",
      disabled: options.database !== "sqlite",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "testing", "Testing", [
    {
      value: "bun",
      label: "Bun test",
      hint: "adds test script and manifest smoke test",
    },
    {
      value: "none",
      label: "None",
      hint: "omits generated test files",
    },
  ]);

  await promptStackSelect(
    options,
    lockedOptions,
    "packageManager",
    "Package manager",
    [
      {
        value: "bun",
        label: "Bun",
        hint: "uses bun install and bun run",
      },
      {
        value: "pnpm",
        label: "pnpm",
        hint: "uses pnpm install and pnpm scripts",
      },
      {
        value: "npm",
        label: "npm",
        hint: "uses npm install and npm run",
      },
      {
        value: "yarn",
        label: "Yarn",
        hint: "uses yarn install and yarn scripts",
      },
    ],
  );

  await promptStackSelect(options, lockedOptions, "buildEnv", "Build env", [
    {
      value: "dev",
      label: "Development",
      hint: "builds with electrobun --env dev",
    },
    {
      value: "canary",
      label: "Canary",
      hint: "builds with electrobun --env canary",
    },
    {
      value: "stable",
      label: "Stable",
      hint: "builds with electrobun --env stable",
    },
  ]);

  await promptStackSelect(
    options,
    lockedOptions,
    "buildTargets",
    "Build targets",
    [
      {
        value: "current",
        label: "Current platform",
        hint: "builds only for this OS",
      },
      {
        value: "all",
        label: "All platforms",
        hint: "builds every configured target",
      },
    ],
  );

  await promptAddons(options, lockedOptions);
  await promptExamples(options, lockedOptions);

  return options;
};
