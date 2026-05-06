import { formatList } from "./utils/format";

export type StackOptions = {
  addons: "none" | "turborepo";
  api: "electrobun-rpc" | "trpc" | "none";
  auth: "none" | "better-auth";
  database: "none" | "sqlite";
  dbSetup: "none";
  examples: "rpc" | "none";
  frontend: "react" | "next" | "none";
  orm: "none" | "drizzle";
  packageManager: "bun";
  runtime: "bun";
  styling: "css" | "tailwindcss";
  ui: "none" | "shadcn";
};

export type UnsupportedStackOption = {
  flag: string;
  note: string;
};

export const defaultStackOptions: StackOptions = {
  addons: "none",
  api: "electrobun-rpc",
  auth: "none",
  database: "none",
  dbSetup: "none",
  examples: "rpc",
  frontend: "react",
  orm: "none",
  packageManager: "bun",
  runtime: "bun",
  styling: "tailwindcss",
  ui: "none",
};

export const stackOptionChoices = {
  addons: ["none", "turborepo"],
  api: ["electrobun-rpc", "trpc", "none"],
  auth: ["none", "better-auth"],
  database: ["none", "sqlite"],
  dbSetup: ["none"],
  examples: ["rpc", "none"],
  frontend: ["react", "next", "none"],
  orm: ["none", "drizzle"],
  packageManager: ["bun"],
  runtime: ["bun"],
  styling: ["tailwindcss", "css"],
  ui: ["none", "shadcn"],
} as const satisfies {
  [Key in keyof StackOptions]: Readonly<Array<StackOptions[Key]>>;
};

export type StackOptionName = keyof StackOptions;

export const stackFlagNames = {
  addons: "addons",
  api: "api",
  auth: "auth",
  database: "database",
  "db-setup": "dbSetup",
  examples: "examples",
  frontend: "frontend",
  orm: "orm",
  "package-manager": "packageManager",
  runtime: "runtime",
  styling: "styling",
  ui: "ui",
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
    case "api":
      options.api = parseStackOptionValue(optionName, value);
      return;
    case "auth":
      options.auth = parseStackOptionValue(optionName, value);
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
    case "runtime":
      options.runtime = parseStackOptionValue(optionName, value);
      return;
    case "styling":
      options.styling = parseStackOptionValue(optionName, value);
      return;
    case "ui":
      options.ui = parseStackOptionValue(optionName, value);
      return;
  }
};

export const getUnsupportedStackOptions = (
  options: StackOptions,
): Array<UnsupportedStackOption> => {
  const unsupported: Array<UnsupportedStackOption> = [];

  if (options.frontend !== "react") {
    unsupported.push({
      flag: `--frontend ${options.frontend}`,
      note: "Only the React WebView renderer is implemented.",
    });
  }

  if (options.api !== "electrobun-rpc") {
    unsupported.push({
      flag: `--api ${options.api}`,
      note: "The current template uses native typed Electrobun RPC.",
    });
  }

  if (options.auth !== "none") {
    unsupported.push({
      flag: `--auth ${options.auth}`,
      note: "Auth is planned for a later full-stack template.",
    });
  }

  if (options.orm === "drizzle" && options.database !== "sqlite") {
    unsupported.push({
      flag: `--database ${options.database} --orm ${options.orm}`,
      note: "Drizzle requires SQLite in the current template.",
    });
  }

  if (options.addons !== "none") {
    unsupported.push({
      flag: `--addons ${options.addons}`,
      note: "Addons are planned after the base templates stabilize.",
    });
  }

  if (options.examples === "rpc" && options.api !== "electrobun-rpc") {
    unsupported.push({
      flag: `--examples rpc --api ${options.api}`,
      note: "The RPC example requires the native Electrobun RPC API.",
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
      `These options are planned but not implemented in the current minimal template:\n${details}`,
    );
  }
};

export const formatStackOptions = (options: StackOptions): Array<string> => {
  return [
    `frontend=${options.frontend}`,
    `runtime=${options.runtime}`,
    `api=${options.api}`,
    `styling=${options.styling}`,
    `ui=${options.ui}`,
    `auth=${options.auth}`,
    `database=${options.database}`,
    `orm=${options.orm}`,
    `dbSetup=${options.dbSetup}`,
    `packageManager=${options.packageManager}`,
    `addons=${options.addons}`,
    `examples=${options.examples}`,
  ];
};
