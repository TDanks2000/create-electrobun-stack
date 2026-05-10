# Manifest Reference

Every generated project includes `ces.json` in the project root.

The manifest is used for:

- Reproducing the scaffold command.
- Showing humans which stack choices were selected.
- Letting `create-electrobun-stack add` expand the project later.
- Giving tools and LLMs a structured source of truth for generated features.

The schema is published in this repository at [ces.schema.json](./ces.schema.json). Generated manifests point `$schema` at the package version on unpkg.

## Compatibility Policy

V1 manifests are additive. Existing generated projects should continue to work with future `create-electrobun-stack add` features as long as their `ces.json` stays in source control and keeps the required top-level stack fields.

The generator may add new optional fields or feature booleans. Tools should ignore unknown fields because the schema allows additional properties.

Breaking manifest migrations require a documented migration path before release. A future generator should not silently rewrite incompatible manifest shapes or drop existing stack state.

## Example

```json
{
  "$schema": "https://unpkg.com/create-electrobun-stack@1.0.0-rc.1/docs/ces.schema.json",
  "version": "1.0.0-rc.1",
  "createdAt": "2026-05-10T00:00:00.000Z",
  "reproducibleCommand": "bunx create-electrobun-stack@1.0.0-rc.1 my-app --template minimal ...",
  "projectName": "my-app",
  "packageName": "my-app",
  "appIdentifier": "dev.electrobun.myapp",
  "template": "minimal",
  "database": "none",
  "orm": "none",
  "query": "none",
  "router": "tanstack-router",
  "runtime": "bun",
  "buildEnv": "dev",
  "buildTargets": "current",
  "frontend": ["react"],
  "styling": "tailwindcss",
  "ui": "none",
  "appMenu": "edit",
  "addons": ["biome", "electrobun", "bun-test", "app-menu", "navigation-guard", "tanstack-router"],
  "examples": ["rpc"],
  "auth": "none",
  "packageManager": "bun",
  "dbSetup": "none",
  "settings": "none",
  "api": "electrobun-rpc",
  "navigation": "local-only",
  "nativeUtils": "none",
  "windowStyle": "native",
  "testing": "bun",
  "git": false,
  "install": false,
  "features": {
    "appLock": false,
    "biome": true,
    "bunPackageManager": true,
    "bunRuntime": true,
    "bunTest": true,
    "drizzle": false,
    "editMenu": true,
    "electrobun": true,
    "electrobunRpc": true,
    "databaseSettings": false,
    "hiddenInsetTitlebar": false,
    "jsonSettings": false,
    "nativeFileDialogs": false,
    "localNavigationGuard": true,
    "plainCss": false,
    "react": true,
    "reactRouter": false,
    "rpcExample": true,
    "shadcn": false,
    "settingsStore": false,
    "sqlite": false,
    "tanstackQuery": false,
    "tanstackRouter": true,
    "tailwindcss": true,
    "turborepo": false,
    "typescript": true,
    "vite": true
  }
}
```

## Top-Level Fields

| Field | Purpose |
| --- | --- |
| `$schema` | JSON schema URL for editor validation. |
| `version` | Generator package version. |
| `createdAt` | Original scaffold timestamp. Preserved by `add`. |
| `reproducibleCommand` | Full command that can recreate the selected stack. |
| `projectName` | Directory/app project name. |
| `packageName` | Generated package name. |
| `appIdentifier` | Electrobun reverse-DNS app identifier. |
| `template` | Selected template profile. |
| `frontend` | Renderer frontend list. Currently `["react"]`. |
| `runtime` | Runtime selection. Currently `bun`. |
| `router` | Renderer routing selection. |
| `query` | Renderer async-state selection. |
| `styling` | Styling mode. |
| `ui` | UI library config selection. |
| `api` | Native bridge selection. |
| `navigation` | Native navigation-rule selection. |
| `nativeUtils` | Native utility example selection. |
| `windowStyle` | Window chrome selection. |
| `appMenu` | Native app menu selection. |
| `buildEnv` | Electrobun build channel. |
| `buildTargets` | Electrobun build target mode. |
| `database` | Database selection. |
| `orm` | ORM selection. |
| `dbSetup` | Database seed/setup selection. |
| `settings` | Settings persistence selection. |
| `auth` | Local app surface auth/lock selection. |
| `testing` | Test scaffold selection. |
| `addons` | Enabled addon labels. |
| `examples` | Enabled example labels. |
| `packageManager` | Install/script command selection. |
| `git` | Whether git was initialized by the CLI. |
| `install` | Whether dependency installation was requested by the CLI. |
| `features` | Boolean feature map for tools and the `add` command. |

## Feature Booleans

`features` is intentionally redundant with top-level fields. It makes generated projects easy to inspect and gives the `add` command stable feature checks.

Generated V1 feature booleans include:

- `appLock`
- `biome`
- `bunPackageManager`
- `bunRuntime`
- `bunTest`
- `drizzle`
- `editMenu`
- `electrobunRpc`
- `databaseSettings`
- `hiddenInsetTitlebar`
- `jsonSettings`
- `nativeFileDialogs`
- `localNavigationGuard`
- `plainCss`
- `react`
- `reactRouter`
- `rpcExample`
- `shadcn`
- `settingsStore`
- `sqlite`
- `tanstackQuery`
- `tanstackRouter`
- `tailwindcss`
- `turborepo`
- `typescript`
- `vite`

## Editing Guidance

Keep `ces.json` in source control. It is the source of truth for future generated additions.

Prefer `create-electrobun-stack add` over manual edits. Hand-edit the manifest only when repairing metadata after a manual migration, and keep top-level fields and feature booleans consistent.

If a new stack option is added to the generator, update:

- `src/options.ts`
- `src/manifest.ts`
- `docs/ces.schema.json`
- This page
- `docs/options.md`
- `docs/llm.txt`
