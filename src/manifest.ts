import type { StackOptions } from "./options";
import { packageName } from "./package-info";
import type { TemplateName } from "./scaffold";
import { collapseStringArrays } from "./utils/json-format";

export type CesFeatureFlags = {
  appLock: boolean;
  biome: boolean;
  bunPackageManager: boolean;
  bunRuntime: boolean;
  bunTest: boolean;
  drizzle: boolean;
  editMenu: boolean;
  electrobun: boolean;
  electrobunRpc: boolean;
  databaseSettings: boolean;
  hiddenInsetTitlebar: boolean;
  jsonSettings: boolean;
  localNavigationGuard: boolean;
  plainCss: boolean;
  react: boolean;
  rpcExample: boolean;
  shadcn: boolean;
  settingsStore: boolean;
  sqlite: boolean;
  tailwindcss: boolean;
  tanstackRouter: boolean;
  turborepo: boolean;
  typescript: boolean;
  vite: boolean;
};

export type CesManifest = {
  $schema: string;
  addons: Array<string>;
  api: StackOptions["api"];
  appMenu: StackOptions["appMenu"];
  appIdentifier: string;
  auth: StackOptions["auth"];
  buildEnv: StackOptions["buildEnv"];
  buildTargets: StackOptions["buildTargets"];
  createdAt: string;
  database: StackOptions["database"];
  dbSetup: StackOptions["dbSetup"];
  examples: Array<string>;
  features: CesFeatureFlags;
  frontend: Array<string>;
  git: boolean;
  install: boolean;
  orm: StackOptions["orm"];
  packageManager: StackOptions["packageManager"];
  packageName: string;
  projectName: string;
  reproducibleCommand: string;
  runtime: StackOptions["runtime"];
  settings: StackOptions["settings"];
  styling: StackOptions["styling"];
  template: TemplateName;
  testing: StackOptions["testing"];
  ui: StackOptions["ui"];
  navigation: StackOptions["navigation"];
  windowStyle: StackOptions["windowStyle"];
  version: string;
};

type CesManifestOptions = {
  appIdentifier: string;
  generatorVersion: string;
  git: boolean;
  install: boolean;
  packageName: string;
  projectName: string;
  stack: StackOptions;
  template: TemplateName;
};

const createFeatureFlags = (stack: StackOptions): CesFeatureFlags => ({
  appLock: stack.auth === "app-lock",
  biome: true,
  bunPackageManager: stack.packageManager === "bun",
  bunRuntime: stack.runtime === "bun",
  bunTest: stack.testing === "bun",
  drizzle: stack.orm === "drizzle",
  editMenu: stack.appMenu === "edit",
  electrobun: true,
  electrobunRpc: stack.api === "electrobun-rpc",
  databaseSettings: stack.settings === "database",
  hiddenInsetTitlebar: stack.windowStyle === "hidden-inset",
  jsonSettings: stack.settings === "json",
  localNavigationGuard: stack.navigation === "local-only",
  plainCss: stack.styling === "css",
  react: stack.frontend === "react",
  rpcExample: stack.examples === "rpc",
  shadcn: stack.ui === "shadcn",
  settingsStore: stack.settings !== "none",
  sqlite: stack.database === "sqlite",
  tailwindcss: stack.styling === "tailwindcss",
  tanstackRouter: stack.frontend === "react",
  turborepo: stack.addons === "turborepo",
  typescript: true,
  vite: stack.frontend === "react",
});

const quoteCommandArg = (value: string): string =>
  /^[a-zA-Z0-9._/@:-]+$/.test(value) ? value : JSON.stringify(value);

const createFrontendList = (stack: StackOptions): Array<string> => [
  stack.frontend,
];

const createExamplesList = (stack: StackOptions): Array<string> =>
  stack.examples === "none" ? [] : [stack.examples];

const createAddonsList = (stack: StackOptions): Array<string> => {
  const addons = ["biome", "electrobun"];

  if (stack.testing === "bun") {
    addons.push("bun-test");
  }

  if (stack.appMenu === "edit") {
    addons.push("app-menu");
  }

  if (stack.navigation === "local-only") {
    addons.push("navigation-guard");
  }

  if (stack.settings === "json") {
    addons.push("settings-json");
  }

  if (stack.settings === "database") {
    addons.push("settings-database");
  }

  if (stack.addons === "turborepo") {
    addons.push("turborepo");
  }

  return addons;
};

const createSchemaUrl = (version: string): string =>
  `https://unpkg.com/${packageName}@${version}/docs/ces.schema.json`;

const createReproducibleCommand = (options: CesManifestOptions): string => {
  const command = [
    "bunx",
    `${packageName}@${options.generatorVersion}`,
    options.projectName,
    "--template",
    options.template,
    "--frontend",
    options.stack.frontend,
    "--runtime",
    options.stack.runtime,
    "--build-env",
    options.stack.buildEnv,
    "--build-targets",
    options.stack.buildTargets,
    "--api",
    options.stack.api,
    "--navigation",
    options.stack.navigation,
    "--window-style",
    options.stack.windowStyle,
    "--styling",
    options.stack.styling,
    "--ui",
    options.stack.ui,
    "--app-menu",
    options.stack.appMenu,
    "--auth",
    options.stack.auth,
    "--database",
    options.stack.database,
    "--orm",
    options.stack.orm,
    "--db-setup",
    options.stack.dbSetup,
    "--settings",
    options.stack.settings,
    "--package-manager",
    options.stack.packageManager,
    "--testing",
    options.stack.testing,
    "--addons",
    options.stack.addons,
    "--examples",
    options.stack.examples,
    "--app-id",
    options.appIdentifier,
    options.git ? "--git" : "--no-git",
    options.install ? "--install" : "--no-install",
  ];

  return command.map(quoteCommandArg).join(" ");
};

export const createCesManifest = (
  options: CesManifestOptions,
): CesManifest => ({
  $schema: createSchemaUrl(options.generatorVersion),
  version: options.generatorVersion,
  createdAt: new Date().toISOString(),
  reproducibleCommand: createReproducibleCommand(options),
  projectName: options.projectName,
  packageName: options.packageName,
  appIdentifier: options.appIdentifier,
  template: options.template,
  database: options.stack.database,
  orm: options.stack.orm,
  runtime: options.stack.runtime,
  buildEnv: options.stack.buildEnv,
  buildTargets: options.stack.buildTargets,
  frontend: createFrontendList(options.stack),
  styling: options.stack.styling,
  ui: options.stack.ui,
  appMenu: options.stack.appMenu,
  addons: createAddonsList(options.stack),
  examples: createExamplesList(options.stack),
  auth: options.stack.auth,
  packageManager: options.stack.packageManager,
  dbSetup: options.stack.dbSetup,
  settings: options.stack.settings,
  api: options.stack.api,
  navigation: options.stack.navigation,
  windowStyle: options.stack.windowStyle,
  testing: options.stack.testing,
  git: options.git,
  install: options.install,
  features: createFeatureFlags(options.stack),
});

export const serializeCesManifest = (manifest: CesManifest): string =>
  `${collapseStringArrays(JSON.stringify(manifest, null, 2))}\n`;
