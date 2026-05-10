import { formatList } from "./utils/format";

type ScaffoldStackOptions = {
  addons: "none" | "turborepo";
  auth: "none" | "app-lock";
  database: "none" | "sqlite";
  dbSetup: "none" | "seed";
  examples: "rpc" | "none";
  frontend: "react";
  orm: "none" | "drizzle";
  packageManager: "bun" | "npm" | "pnpm" | "yarn";
  query: "none" | "tanstack-query";
  router: "none" | "tanstack-router" | "react-router";
  runtime: "bun";
  settings: "none" | "json" | "database";
  styling: "css" | "tailwindcss";
  testing: "bun" | "none";
  ui: "none" | "shadcn";
};

export type ElectrobunFeatureOptions = {
  api: "electrobun-rpc" | "none";
  appMenu: "edit" | "none";
  buildEnv: "dev" | "canary" | "stable";
  buildTargets: "current" | "all";
  navigation: "local-only" | "none";
  nativeUtils: "none" | "file-dialogs";
  windowStyle: "native" | "hidden-inset";
};

export type StackOptions = ScaffoldStackOptions & ElectrobunFeatureOptions;

export type UnsupportedStackOption = {
  flag: string;
  note: string;
};

export const defaultElectrobunFeatureOptions: ElectrobunFeatureOptions = {
  api: "electrobun-rpc",
  appMenu: "edit",
  buildEnv: "dev",
  buildTargets: "current",
  navigation: "local-only",
  nativeUtils: "none",
  windowStyle: "native",
};

const defaultScaffoldStackOptions: ScaffoldStackOptions = {
  addons: "none",
  auth: "none",
  database: "none",
  dbSetup: "none",
  examples: "rpc",
  frontend: "react",
  orm: "none",
  packageManager: "bun",
  query: "none",
  router: "tanstack-router",
  runtime: "bun",
  settings: "none",
  styling: "tailwindcss",
  testing: "bun",
  ui: "none",
};

export const defaultStackOptions: StackOptions = {
  ...defaultScaffoldStackOptions,
  ...defaultElectrobunFeatureOptions,
};

const scaffoldStackOptionChoices = {
  addons: ["none", "turborepo"],
  auth: ["none", "app-lock"],
  database: ["none", "sqlite"],
  dbSetup: ["none", "seed"],
  examples: ["rpc", "none"],
  frontend: ["react"],
  orm: ["none", "drizzle"],
  packageManager: ["bun", "npm", "pnpm", "yarn"],
  query: ["none", "tanstack-query"],
  router: ["tanstack-router", "react-router", "none"],
  runtime: ["bun"],
  settings: ["none", "json", "database"],
  styling: ["tailwindcss", "css"],
  testing: ["bun", "none"],
  ui: ["none", "shadcn"],
} as const satisfies {
  [Key in keyof ScaffoldStackOptions]: Readonly<
    Array<ScaffoldStackOptions[Key]>
  >;
};

const electrobunFeatureOptionChoices = {
  api: ["electrobun-rpc", "none"],
  appMenu: ["edit", "none"],
  buildEnv: ["dev", "canary", "stable"],
  buildTargets: ["current", "all"],
  navigation: ["local-only", "none"],
  nativeUtils: ["none", "file-dialogs"],
  windowStyle: ["native", "hidden-inset"],
} as const satisfies {
  [Key in keyof ElectrobunFeatureOptions]: Readonly<
    Array<ElectrobunFeatureOptions[Key]>
  >;
};

export const stackOptionChoices = {
  ...scaffoldStackOptionChoices,
  ...electrobunFeatureOptionChoices,
} as const satisfies {
  [Key in keyof StackOptions]: Readonly<Array<StackOptions[Key]>>;
};

export type StackOptionName = keyof StackOptions;

const scaffoldStackFlagNames = {
  addons: "addons",
  auth: "auth",
  database: "database",
  "db-setup": "dbSetup",
  examples: "examples",
  frontend: "frontend",
  orm: "orm",
  "package-manager": "packageManager",
  query: "query",
  router: "router",
  runtime: "runtime",
  settings: "settings",
  styling: "styling",
  testing: "testing",
  ui: "ui",
} as const satisfies Record<string, keyof ScaffoldStackOptions>;

const electrobunFeatureFlagNames = {
  api: "api",
  "app-menu": "appMenu",
  "build-env": "buildEnv",
  "build-targets": "buildTargets",
  navigation: "navigation",
  "native-utils": "nativeUtils",
  "window-style": "windowStyle",
} as const satisfies Record<string, keyof ElectrobunFeatureOptions>;

export const stackFlagNames = {
  ...scaffoldStackFlagNames,
  ...electrobunFeatureFlagNames,
} as const satisfies Record<string, StackOptionName>;

export type StackFlagName = keyof typeof stackFlagNames;

export const isStackFlagName = (value: string): value is StackFlagName =>
  value in stackFlagNames;

export const parseStackOptionValue = <Name extends StackOptionName>(
  name: Name,
  value: string,
): StackOptions[Name] => {
  const choices = stackOptionChoices[name];

  if (choices.some((choice) => choice === value)) {
    return value as StackOptions[Name];
  }

  const flagName =
    Object.entries(stackFlagNames).find(
      ([, optionName]) => optionName === name,
    )?.[0] ?? name;

  throw new Error(
    `Expected --${flagName} to be one of: ${formatList([...choices])}. Received "${value}".`,
  );
};

export const setStackOption = (
  options: StackOptions,
  flagName: StackFlagName,
  value: string,
): void => {
  const optionName = stackFlagNames[flagName];

  switch (optionName) {
    case "addons":
      options.addons = parseStackOptionValue(optionName, value);
      return;
    case "appMenu":
      options.appMenu = parseStackOptionValue(optionName, value);
      return;
    case "api":
      options.api = parseStackOptionValue(optionName, value);
      return;
    case "auth":
      options.auth = parseStackOptionValue(optionName, value);
      return;
    case "buildEnv":
      options.buildEnv = parseStackOptionValue(optionName, value);
      return;
    case "buildTargets":
      options.buildTargets = parseStackOptionValue(optionName, value);
      return;
    case "database":
      options.database = parseStackOptionValue(optionName, value);
      return;
    case "dbSetup":
      options.dbSetup = parseStackOptionValue(optionName, value);
      return;
    case "examples":
      options.examples = parseStackOptionValue(optionName, value);
      return;
    case "frontend":
      options.frontend = parseStackOptionValue(optionName, value);
      return;
    case "orm":
      options.orm = parseStackOptionValue(optionName, value);
      return;
    case "packageManager":
      options.packageManager = parseStackOptionValue(optionName, value);
      return;
    case "query":
      options.query = parseStackOptionValue(optionName, value);
      return;
    case "router":
      options.router = parseStackOptionValue(optionName, value);
      return;
    case "runtime":
      options.runtime = parseStackOptionValue(optionName, value);
      return;
    case "settings":
      options.settings = parseStackOptionValue(optionName, value);
      return;
    case "styling":
      options.styling = parseStackOptionValue(optionName, value);
      return;
    case "testing":
      options.testing = parseStackOptionValue(optionName, value);
      return;
    case "ui":
      options.ui = parseStackOptionValue(optionName, value);
      return;
    case "navigation":
      options.navigation = parseStackOptionValue(optionName, value);
      return;
    case "nativeUtils":
      options.nativeUtils = parseStackOptionValue(optionName, value);
      return;
    case "windowStyle":
      options.windowStyle = parseStackOptionValue(optionName, value);
      return;
  }
};

export const getUnsupportedStackOptions = (
  options: StackOptions,
): Array<UnsupportedStackOption> => {
  const unsupported: Array<UnsupportedStackOption> = [];

  if (options.orm === "drizzle" && options.database !== "sqlite") {
    unsupported.push({
      flag: `--database ${options.database} --orm ${options.orm}`,
      note: "Drizzle requires SQLite in the current template.",
    });
  }

  if (options.dbSetup === "seed" && options.database !== "sqlite") {
    unsupported.push({
      flag: `--database ${options.database} --db-setup ${options.dbSetup}`,
      note: "Seed data requires SQLite in the current template.",
    });
  }

  if (options.examples === "rpc" && options.api !== "electrobun-rpc") {
    unsupported.push({
      flag: `--examples rpc --api ${options.api}`,
      note: "The RPC example requires the native Electrobun RPC API.",
    });
  }

  if (options.settings !== "none" && options.api !== "electrobun-rpc") {
    unsupported.push({
      flag: `--settings ${options.settings} --api ${options.api}`,
      note: "Settings storage requires the native Electrobun RPC API.",
    });
  }

  if (options.nativeUtils !== "none" && options.api !== "electrobun-rpc") {
    unsupported.push({
      flag: `--native-utils ${options.nativeUtils} --api ${options.api}`,
      note: "Native utility examples require the native Electrobun RPC API.",
    });
  }

  if (options.settings === "database" && options.database !== "sqlite") {
    unsupported.push({
      flag: `--database ${options.database} --settings ${options.settings}`,
      note: "Database-backed settings require SQLite in the current template.",
    });
  }

  if (options.ui === "shadcn" && options.styling !== "tailwindcss") {
    unsupported.push({
      flag: `--ui shadcn --styling ${options.styling}`,
      note: "shadcn/ui requires Tailwind CSS in this template.",
    });
  }

  return unsupported;
};

export const validateStackOptions = (options: StackOptions): void => {
  const unsupported = getUnsupportedStackOptions(options);

  if (unsupported.length > 0) {
    const details = unsupported
      .map((item) => `${item.flag}: ${item.note}`)
      .join("\n");
    throw new Error(
      `These stack options cannot be combined in the current template:\n${details}`,
    );
  }
};

export const formatStackOptions = (options: StackOptions): Array<string> => {
  return [
    `frontend=${options.frontend}`,
    `router=${options.router}`,
    `query=${options.query}`,
    `runtime=${options.runtime}`,
    `buildEnv=${options.buildEnv}`,
    `buildTargets=${options.buildTargets}`,
    `api=${options.api}`,
    `navigation=${options.navigation}`,
    `nativeUtils=${options.nativeUtils}`,
    `windowStyle=${options.windowStyle}`,
    `styling=${options.styling}`,
    `ui=${options.ui}`,
    `appMenu=${options.appMenu}`,
    `auth=${options.auth}`,
    `database=${options.database}`,
    `orm=${options.orm}`,
    `dbSetup=${options.dbSetup}`,
    `settings=${options.settings}`,
    `packageManager=${options.packageManager}`,
    `testing=${options.testing}`,
    `addons=${options.addons}`,
    `examples=${options.examples}`,
  ];
};
