# Templates

Templates live under `templates/<template-source>`.

The generator currently accepts these profiles:

- `minimal`
- `standard`
- `full`

All profiles currently render from the same stable `templates/minimal` source. The selected profile is still recorded in `ces.json`, which leaves room for future profile-specific defaults without changing the manifest contract.

## Render Order

The scaffold process renders:

1. `templates/minimal/base`
2. Any selected option directories under `templates/minimal/options`
3. `ces.json`

Option directories can add files or override earlier files at the same output path.

For example, `--database sqlite` adds a raw SQLite client, and `--orm drizzle` overlays the database client with a Drizzle-backed version plus schema/config files.

## Source Structure

```txt
templates/minimal/
  base/
    package.json.hbs
    README.md.hbs
    vite.config.ts.hbs
    electrobun.config.ts.hbs
    src/
      bun/
      shared/
      views/
  options/
    addons/
      turborepo/
    app-menu/
      edit/
    database/
      json-file/
      sqlite/
    orm/
      drizzle/
    router/
      tanstack-router/
    settings/
      json/
      database/
    styling/
      tailwindcss/
    testing/
      bun/
      desktop-smoke/
    ui/
      shadcn/
```

## Base Template

`base` is always rendered. It contains the common Electrobun app:

- Bun entrypoint and window creation.
- Shared renderer styles and framework-neutral renderer support files.
- Shared constants and types.
- Optional RPC, router, query, settings, and styling branches controlled by Handlebars data.
- Generated README tailored to selected stack flags.
- `package.json`, `tsconfig.json`, `biome.json`, Vite config, and Electrobun config.

Because `base` contains conditional branches, not every option needs a separate overlay directory.

## Option Directories

### `addons/turborepo`

Adds `turbo.json` and enables Turbo scripts/dependency through the base `package.json` template.

### `app-menu/edit`

Adds `src/bun/menu.ts`. The base Bun entrypoint calls it when `--app-menu edit` is selected.

### `frontend/jsx`

Adds the React/Preact Vite renderer entrypoint, `App`, `Home`, and `index.html`.

### `frontend/svelte-common`

Adds the shared Svelte `Home.svelte` renderer used by both Svelte frontend modes.

### `frontend/svelte`

Adds the direct Svelte Vite entrypoint, `App.svelte`, and `index.html`.

### `frontend/sveltekit`

Adds SvelteKit static adapter config and routes under `src/views/main/routes`.

### `database/sqlite`

Adds a Bun SQLite client and database status surface.

### `database/json-file`

Adds a local JSON record store and database status surface.

### `orm/drizzle`

Adds Drizzle files and overlays the SQLite client when Drizzle is selected.

### `router/tanstack-router`

Adds TanStack Router route files and the generated route tree placeholder.

React Router and no-router modes are handled inside the base renderer templates.

### `settings/json`

Adds a settings store backed by `data/settings.json`.

### `settings/database`

Adds a settings store backed by SQLite.

### `styling/tailwindcss`

Adds Tailwind-specific style overlays.

Plain CSS is handled by the base style templates.

### `packaging/installers`

Adds `scripts/package-electrobun.ts`. The base package, TypeScript, and README templates add packaging commands and references when `--packaging installers` is selected.

### `testing/bun`

Adds `tests/manifest.test.ts`. The base package and TypeScript templates add the script and include path when testing is enabled.

### `testing/desktop-smoke`

Adds `tests/desktop-smoke.test.ts`. The scaffold also renders `testing/bun` first so desktop smoke projects keep the generated manifest test.

### `ui/shadcn`

Adds `components.json` and enables shadcn-related config branches in the base templates.

## Template Data

Template data is built in `src/scaffold.ts`. Important booleans include:

- `hasElectrobunRpc`
- `hasRpcExample`
- `hasTanstackRouter`
- `hasReactRouter`
- `hasTanstackQuery`
- `hasPreactFrontend`
- `hasReactFrontend`
- `hasSvelteFrontend`
- `hasSvelteKitFrontend`
- `hasSvelteFamilyFrontend`
- `hasTailwind`
- `hasShadcn`
- `hasDatabase`
- `hasJsonDatabase`
- `hasSqlite`
- `hasDrizzle`
- `hasJsonSettings`
- `hasDatabaseSettings`
- `hasNativeClipboard`
- `hasNativeFileDialogs`
- `hasInstallerPackaging`
- `hasDesktopSmokeTest`
- `hasAppMenu`
- `hasNavigationGuard`
- `hasHiddenInsetTitlebar`
- `hasTesting`
- `hasTurborepo`

Prefer adding a clear boolean in `templateData` over duplicating complex option checks across many `.hbs` files.

## Adding A New Option

When adding a scaffold option:

1. Add the option type, defaults, choices, flag mapping, and validation in `src/options.ts`.
2. Add prompt labels in `src/prompts.ts` if the option is interactive.
3. Add manifest fields or feature booleans in `src/manifest.ts`.
4. Add template data in `src/scaffold.ts`.
5. Add a new option directory only when the option needs new files or an overlay.
6. Update tests in `tests/cli.test.ts`.
7. Update `README.md`, `docs/reference/cli.md`, `docs/reference/options.md`, `docs/guides/generated-project.md`, `docs/reference/manifest.md`, and `docs/llms.txt`.

Keep option overlays narrow. A template directory should own a feature, not a broad refactor of unrelated base files.
