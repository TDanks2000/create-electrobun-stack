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
    hint: "V1 alias for the stable minimal scaffold",
  },
  {
    value: "full",
    label: "Full",
    hint: "V1 alias for the stable minimal scaffold",
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

const promptElectrobunFeatures = async (
  options: StackOptions,
  lockedOptions: ReadonlySet<StackOptionName>,
): Promise<void> => {
  await promptStackSelect(options, lockedOptions, "api", "Native bridge", [
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
    "nativeUtils",
    "Desktop utilities",
    [
      {
        value: "none",
        label: "None",
        hint: "does not add native utility examples",
      },
      {
        value: "file-dialogs",
        label: "File dialogs",
        hint:
          options.api === "electrobun-rpc"
            ? "adds a typed open-file dialog request"
            : "requires Electrobun RPC",
        disabled: options.api !== "electrobun-rpc",
      },
      {
        value: "clipboard",
        label: "Clipboard",
        hint:
          options.api === "electrobun-rpc"
            ? "adds typed clipboard read/write requests"
            : "requires Electrobun RPC",
        disabled: options.api !== "electrobun-rpc",
      },
      {
        value: "desktop-kit",
        label: "Desktop kit",
        hint:
          options.api === "electrobun-rpc"
            ? "adds file dialog and clipboard requests"
            : "requires Electrobun RPC",
        disabled: options.api !== "electrobun-rpc",
      },
    ],
  );

  await promptStackSelect(
    options,
    lockedOptions,
    "navigation",
    "Navigation rules",
    [
      {
        value: "local-only",
        label: "Bundled views only",
        hint: "blocks navigation outside app views",
      },
      {
        value: "none",
        label: "None",
        hint: "does not install native navigation rules",
      },
    ],
  );

  await promptStackSelect(
    options,
    lockedOptions,
    "windowStyle",
    "Window chrome",
    [
      {
        value: "native",
        label: "Native titlebar",
        hint: "uses the default OS window chrome",
      },
      {
        value: "hidden-inset",
        label: "Inset titlebar",
        hint: "adds hiddenInset titlebar and draggable header",
      },
    ],
  );

  await promptStackSelect(options, lockedOptions, "appMenu", "Native menu", [
    {
      value: "edit",
      label: "Edit roles",
      hint: "adds native copy, paste, and undo shortcuts",
    },
    {
      value: "none",
      label: "None",
      hint: "omits the application menu scaffold",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "buildEnv", "Build channel", [
    {
      value: "dev",
      label: "Development",
      hint: "passes --env dev to electrobun build",
    },
    {
      value: "canary",
      label: "Canary",
      hint: "passes --env canary to electrobun build",
    },
    {
      value: "stable",
      label: "Stable",
      hint: "passes --env stable to electrobun build",
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
    {
      value: "preact",
      label: "Preact WebView",
      hint: "generates a smaller direct-rendered Preact view",
    },
    {
      value: "svelte",
      label: "Svelte WebView",
      hint: "generates a direct-rendered Svelte view",
    },
    {
      value: "sveltekit",
      label: "SvelteKit WebView",
      hint: "generates a static SvelteKit renderer",
    },
  ]);

  if (options.frontend !== "react") {
    if (!lockedOptions.has("router")) {
      options.router = "none";
    }

    if (!lockedOptions.has("query")) {
      options.query = "none";
    }

    if (!lockedOptions.has("ui")) {
      options.ui = "none";
    }
  }

  await promptStackSelect(options, lockedOptions, "router", "Router", [
    {
      value: "tanstack-router",
      label: "TanStack Router",
      hint:
        options.frontend === "react"
          ? "adds file-based routes with the TanStack Vite plugin"
          : "requires React renderer",
      disabled: options.frontend !== "react",
    },
    {
      value: "react-router",
      label: "React Router",
      hint:
        options.frontend === "react"
          ? "adds React Router with hash history"
          : "requires React renderer",
      disabled: options.frontend !== "react",
    },
    {
      value: "none",
      label: "None",
      hint: "renders the starter view without a router",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "query", "Data fetching", [
    {
      value: "none",
      label: "None",
      hint: "does not add a server-state client",
    },
    {
      value: "tanstack-query",
      label: "TanStack Query",
      hint:
        options.frontend === "react"
          ? "adds QueryClientProvider for async state"
          : "requires React renderer",
      disabled: options.frontend !== "react",
    },
  ]);

  await promptElectrobunFeatures(options, lockedOptions);

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
        options.frontend !== "react"
          ? "requires React renderer"
          : options.styling === "tailwindcss"
            ? "adds components.json for shadcn/ui"
            : "requires Tailwind CSS",
      disabled:
        options.frontend !== "react" || options.styling !== "tailwindcss",
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
    {
      value: "json-file",
      label: "JSON file",
      hint: "adds a typed local JSON record store",
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
      disabled:
        options.api !== "electrobun-rpc" || options.database !== "sqlite",
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
        options.database !== "none"
          ? "adds a starter metadata row"
          : "requires a generated database",
      disabled: options.database === "none",
    },
  ]);

  await promptStackSelect(options, lockedOptions, "testing", "Testing", [
    {
      value: "bun",
      label: "Bun test",
      hint: "adds test script and manifest smoke test",
    },
    {
      value: "desktop-smoke",
      label: "Desktop smoke",
      hint: "adds Bun tests plus a mocked Electrobun launch smoke test",
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

  await promptStackSelect(
    options,
    lockedOptions,
    "packaging",
    "Installer packaging",
    [
      {
        value: "none",
        label: "Electrobun artifacts",
        hint: "uses Electrobun's built-in artifacts only",
      },
      {
        value: "installers",
        label: "Installer suite",
        hint: "adds AppImage, deb, DMG, and NSIS packaging helpers",
      },
    ],
  );

  await promptAddons(options, lockedOptions);
  await promptExamples(options, lockedOptions);

  return options;
};
