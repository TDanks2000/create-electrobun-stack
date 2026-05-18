# Stack Options

This page explains what each option scaffolds and where to look after the project is generated.

## Support Boundary

All options documented on this page are supported public CLI options. Supported means the option is represented in `ces.json` and is covered by unit tests, render validation, or the generated-project validation matrix.

Some categories remain intentionally narrow:

- `--runtime bun` is fixed because Electrobun apps run through Bun.
- `--orm drizzle` is tied to SQLite because the generated Drizzle client uses `drizzle-orm/bun-sqlite`.
- `--settings database` is tied to SQLite because the generated settings table and Drizzle schema are SQLite-specific.
- `--template standard` and `--template full` are accepted compatibility aliases for the same V1 template source as `minimal`; they are not advertised as distinct stacks until their generated output differs and has release-gate coverage.

## Option Depth Decisions

| Category | Decision |
| --- | --- |
| Template | `minimal` is canonical; `standard` and `full` are accepted aliases only. |
| Frontend | React is the default and supports router/query/UI integrations. Preact and Svelte are available for smaller direct-rendered WebViews. SvelteKit is available as a static WebView renderer with SvelteKit file routing. |
| Router | `tanstack-router`, `react-router`, and `none` are distinct supported choices. |
| Query | `tanstack-query` and `none` are enough for V1. |
| Styling | Tailwind CSS and plain CSS cover framework and no-framework styling. |
| UI | shadcn config and `none` are supported; generated components are left to the app. |
| Auth | `app-lock` is a local UI lock, not remote auth; deeper auth is post-V1 work. |
| Database | SQLite covers relational local storage; JSON-file persistence covers lightweight local records without SQLite. |
| ORM | Drizzle is the V1 ORM option; another ORM needs clear desktop value before inclusion. |
| DB setup | Seed data works with generated database clients. |
| Settings | JSON and database-backed settings are both supported through the same typed RPC surface. |
| Package manager | Bun, npm, pnpm, and Yarn are supported for install/run command text. |
| Testing | Bun tests, mocked desktop launch smoke tests, and `none` are supported. |
| Addons | Turborepo and `none` are supported. |
| Examples | RPC example and `none` are supported; option-specific examples are post-V1 work. |
| API | Electrobun RPC and static/no-RPC modes are supported. |
| App menu | Native Edit menu and `none` are supported. |
| Build env | `dev`, `canary`, and `stable` map directly to Electrobun build flags. |
| Build targets | `current` and `all` map directly to Electrobun build flags. |
| Navigation | Local-only navigation rules and `none` are supported. |
| Native utils | File dialogs, clipboard utilities, the combined desktop kit, and `none` are supported. |
| Window style | Native and hidden inset titlebar modes are supported. |
| Runtime | Fixed to Bun for V1 because Electrobun runs the native process through Bun. |
| Packaging | `installers` adds optional packaging helpers for teams that need AppImage, deb, DMG collection, and NSIS wrapping beyond Electrobun's built-in artifacts. |

## Core App

### `--template minimal|standard|full`

Selects the template profile. All three profile names are accepted and written to `ces.json`. Today they share the stable `minimal` template source, so their generated files are intentionally equivalent except for manifest identity.

Relevant files:

- `ces.json`
- `README.md`

### `--frontend react`

Generates a React renderer for the Electrobun WebView.

Relevant files:

- `src/views/main/main.tsx`
- `src/views/main/app.tsx`
- `src/views/main/home.tsx`

React is the default frontend and supports all generated router, query, shadcn, and renderer examples.

### `--frontend preact`

Generates a Preact renderer for the Electrobun WebView.

Relevant files:

- `src/views/main/main.tsx`
- `src/views/main/app.tsx`
- `src/views/main/home.tsx`
- `vite.config.ts`
- `tsconfig.json`
- `package.json`

Preact currently supports direct rendering only. Use it with `--router none`, `--query none`, and `--ui none`.

### `--frontend svelte`

Generates a Svelte renderer for the Electrobun WebView.

Relevant files:

- `src/views/main/main.ts`
- `src/views/main/App.svelte`
- `src/views/main/Home.svelte`
- `vite.config.ts`
- `tsconfig.json`
- `package.json`

Svelte currently supports direct rendering only. Use it with `--router none`, `--query none`, and `--ui none`.

### `--frontend sveltekit`

Generates a static SvelteKit renderer for the Electrobun WebView. The SvelteKit adapter writes built files into `.electrobun/views/main`, which Electrobun packages as `views://main/index.html`.

Relevant files:

- `svelte.config.js`
- `src/views/main/app.html`
- `src/views/main/routes/+layout.svelte`
- `src/views/main/routes/+layout.ts`
- `src/views/main/routes/+page.svelte`
- `src/views/main/Home.svelte`
- `vite.config.ts`
- `tsconfig.json`
- `package.json`

SvelteKit uses its own file routing in this template. Use it with `--router none`, `--query none`, and `--ui none`.

### `--runtime bun`

Uses Bun for the native process. Electrobun runs the app through a Bun entrypoint.

Relevant files:

- `src/bun/index.ts`
- `src/bun/window.ts`
- `package.json`

## Renderer Routing

### `--router tanstack-router`

Adds TanStack Router with file-based routes and the TanStack Vite plugin.

Relevant files:

- `src/views/main/routes/__root.tsx`
- `src/views/main/routes/index.tsx`
- `src/views/main/routeTree.gen.ts`
- `vite.config.ts`

Notes:

- `routeTree.gen.ts` is generated by the TanStack Router Vite plugin.
- `biome.json` ignores the generated route tree.

### `--router react-router`

Adds React Router with `HashRouter`, which is a good fit for a bundled `views://` desktop renderer.

Relevant files:

- `src/views/main/app.tsx`
- `package.json`

### `--router none`

Renders the starter view directly without a renderer router.

Relevant files:

- `src/views/main/app.tsx`
- `src/views/main/home.tsx`

## Async State

### `--query none`

Does not add a server-state client.

### `--query tanstack-query`

Adds TanStack Query and wraps the renderer in `QueryClientProvider`.

Relevant files:

- `src/views/main/app.tsx`
- `package.json`

Use this when the renderer will call native RPC, sync APIs, or remote APIs often enough that request caching and invalidation are useful.

## Styling And UI

### `--styling tailwindcss`

Adds Tailwind CSS v4 through the Vite plugin.

Relevant files:

- `src/views/main/styles/globals.css`
- `src/views/main/styles/app.css`
- `vite.config.ts`
- `package.json`

### `--styling css`

Uses plain CSS and skips Tailwind dependencies.

Relevant files:

- `src/views/main/styles/globals.css`
- `src/views/main/styles/app.css`

### `--ui shadcn`

Adds shadcn/ui project configuration. This requires Tailwind CSS.

Relevant files:

- `components.json`
- `tsconfig.json`
- `src/views/main/styles/globals.css`
- `package.json`

The generator does not add individual shadcn components. It prepares the app so you can add them with the shadcn CLI.

### `--ui none`

Does not add component library configuration.

## Native Electrobun Features

### `--api electrobun-rpc`

Adds a typed Electrobun RPC bridge between the Bun process and the WebView.

Relevant files:

- `src/bun/rpc/router.ts`
- `src/bun/rpc/handlers.ts`
- `src/shared/rpc/schema.ts`
- `src/shared/rpc/types.ts`
- `src/views/main/lib/rpc.ts`
- `src/bun/window.ts`

### `--api none`

Omits BrowserWindow RPC wiring and generates a static renderer API surface.

Use this for static desktop shells or when you plan to add native bridge code manually.

### `--examples rpc`

Adds a small greeting/logging RPC demo to the generated renderer and Bun handlers.

Relevant files:

- `src/views/main/home.tsx`
- `src/bun/rpc/router.ts`
- `src/bun/rpc/handlers.ts`
- `src/shared/rpc/schema.ts`
- `README.md`

### `--examples none`

Keeps the selected infrastructure but omits demo RPC calls and the generated README RPC example section.

### `--navigation local-only`

Adds native navigation rules so the WebView stays on bundled `views://` content and `about:blank`.

Relevant files:

- `src/bun/window.ts`

### `--navigation none`

Does not install navigation rules.

### `--native-utils file-dialogs`

Adds a typed RPC request backed by Electrobun `Utils.openFileDialog`.

Relevant files:

- `src/bun/rpc/handlers.ts`
- `src/bun/rpc/router.ts`
- `src/shared/rpc/schema.ts`
- `src/shared/types.ts`
- `src/views/main/home.tsx`

Requires `--api electrobun-rpc`.

### `--native-utils clipboard`

Adds typed RPC requests for Electrobun clipboard read, write, and clear operations.

Relevant files:

- `src/bun/rpc/handlers.ts`
- `src/bun/rpc/router.ts`
- `src/shared/rpc/schema.ts`
- `src/shared/types.ts`
- `src/views/main/home.tsx`

Requires `--api electrobun-rpc`.

### `--native-utils desktop-kit`

Adds both file-dialog and clipboard utilities.

Relevant files:

- `src/bun/rpc/handlers.ts`
- `src/bun/rpc/router.ts`
- `src/shared/rpc/schema.ts`
- `src/shared/types.ts`
- `src/views/main/home.tsx`

Requires `--api electrobun-rpc`.

### `--native-utils none`

Does not add native utility examples.

### `--window-style native`

Uses the operating system's default window chrome.

### `--window-style hidden-inset`

Uses Electrobun's hidden inset titlebar mode and adds a draggable header in the renderer.

Relevant files:

- `src/bun/window.ts`
- `src/views/main/home.tsx`
- `src/views/main/styles/app.css`

### `--app-menu edit`

Adds an Electrobun `ApplicationMenu` with native Edit roles for copy, paste, undo, redo, and select-all shortcuts.

Relevant files:

- `src/bun/menu.ts`
- `src/bun/index.ts`

### `--app-menu none`

Omits the generated menu file and setup call.

## Persistence

### `--database none`

Does not add database files.

### `--database sqlite`

Adds a local SQLite client using Bun's SQLite support.

Relevant files:

- `src/bun/db/client.ts`
- `src/shared/types.ts`
- `src/bun/rpc/router.ts`
- `src/shared/rpc/schema.ts`

### `--database json-file`

Adds a local JSON record store at `data/app-db.json`.

Relevant files:

- `src/bun/db/client.ts`
- `src/shared/types.ts`
- `src/bun/rpc/router.ts`
- `src/shared/rpc/schema.ts`

Use this for lightweight local persistence when SQLite would be more structure than the app needs.

### `--orm drizzle`

Adds Drizzle ORM on top of SQLite. This requires `--database sqlite`.

Relevant files:

- `src/bun/db/client.ts`
- `src/bun/db/schema.ts`
- `drizzle.config.ts`
- `package.json`

Generated commands:

```bash
bun run db:generate
bun run db:studio
```

### `--orm none`

Uses the raw database client when SQLite is selected and skips ORM files.

### `--db-setup seed`

Adds starter metadata when the generated database is empty. This requires `--database sqlite` or `--database json-file`.

Relevant files:

- `src/bun/db/client.ts`

### `--db-setup none`

Leaves the generated database without starter seed data.

### `--settings json`

Adds a VS Code-style settings store backed by `data/settings.json`. Settings use dotted keys such as `app.theme`.

Relevant files:

- `src/bun/settings/store.ts`
- `src/shared/rpc/schema.ts`
- `src/bun/rpc/router.ts`
- `src/views/main/home.tsx`

Requires `--api electrobun-rpc`.

### `--settings database`

Stores the same key/value settings model in SQLite. This requires `--api electrobun-rpc` and `--database sqlite`.

Relevant files:

- `src/bun/settings/store.ts`
- `src/bun/db/schema.ts` when Drizzle is selected
- `src/shared/rpc/schema.ts`
- `src/bun/rpc/router.ts`
- `src/views/main/home.tsx`

### `--settings none`

Does not add settings persistence.

## App Surface

### `--auth none`

Does not add an auth or lock screen.

### `--auth app-lock`

Adds a local app-name unlock screen in the renderer. This is a local UI lock, not remote authentication.

Relevant files:

- `src/views/main/home.tsx`
- `src/views/main/styles/app.css`

## Build Output

### `--build-env dev|canary|stable`

Controls the `electrobun build --env=<value>` script in `package.json`.

### `--build-targets current|all`

Controls the `electrobun build --targets=<value>` script in `package.json`.

Use `current` for local builds and `all` when you are intentionally producing all configured platform targets.

### `--packaging installers`

Adds release packaging helpers around Electrobun's `artifacts/` output.

Relevant files:

- `scripts/package-electrobun.ts`
- `package.json`
- `tsconfig.json`
- `README.md`

Generated commands:

```bash
bun run package:release
bun run package:linux
bun run package:mac
bun run package:windows
```

The script copies Electrobun artifacts, copies the generated macOS DMG, builds Linux deb packages with `dpkg-deb`, builds Linux AppImages with `appimagetool`, and builds a Windows NSIS wrapper around Electrobun's Windows setup executable with `makensis`. Run platform-specific packaging on matching OS runners.

### `--packaging none`

Uses Electrobun's built-in release artifacts without adding extra packaging scripts.

## Tooling

### `--package-manager bun|npm|pnpm|yarn`

Controls install and run command text, package manager metadata, and the post-scaffold install command. It does not change the runtime; Electrobun still runs on Bun.

Relevant files:

- `package.json`
- `README.md`

### `--testing bun`

Adds a Bun test script and a generated manifest smoke test.

Relevant files:

- `tests/manifest.test.ts`
- `package.json`
- `tsconfig.json`

### `--testing desktop-smoke`

Adds the Bun test script, the generated manifest smoke test, and a mocked Electrobun desktop launch smoke test. The desktop smoke test imports the generated Bun entry surface with `electrobun/bun` mocked, creates the main window, and verifies the generated launch options without opening a real OS window.

Relevant files:

- `tests/manifest.test.ts`
- `tests/desktop-smoke.test.ts`
- `package.json`
- `tsconfig.json`

### `--testing none`

Omits the test script and test files.

### `--addons turborepo`

Adds Turborepo as a task runner wrapper.

Relevant files:

- `turbo.json`
- `package.json`
- `README.md`

Generated command:

```bash
bun run check
```

### `--addons none`

Does not add Turborepo.

## Combination Rules

The CLI validates stack choices before writing files:

- Drizzle requires SQLite.
- Seed data requires a generated database.
- Database-backed settings require SQLite.
- Settings require Electrobun RPC.
- Native utility examples require Electrobun RPC.
- The RPC example requires Electrobun RPC.
- shadcn/ui requires Tailwind CSS.
- Non-React renderers require direct rendering or framework routing with no React router, TanStack Query, or shadcn config.

The `add` command can infer prerequisites for additive changes. For example, adding Drizzle can also add SQLite, and adding shadcn can also add Tailwind CSS.
