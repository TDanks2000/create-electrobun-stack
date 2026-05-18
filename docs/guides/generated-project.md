# Generated Project Guide

This guide explains the project that `create-electrobun-stack` writes to disk.

## Layout

A typical generated app looks like this:

```txt
my-app/
  ces.json
  package.json
  README.md
  electrobun.config.ts
  vite.config.ts
  biome.json
  tsconfig.json
  scripts/
    package-electrobun.ts
  tests/
    manifest.test.ts
    desktop-smoke.test.ts
  src/
    bun/
      index.ts
      menu.ts
      window.ts
      rpc/
        handlers.ts
        router.ts
    shared/
      constants.ts
      types.ts
      rpc/
        schema.ts
        types.ts
    views/
      main/
        index.html
        main.tsx
        app.tsx
        home.tsx
        lib/
          rpc.ts
        routes/
          __root.tsx
          index.tsx
        routeTree.gen.ts
        styles/
          globals.css
          app.css
```

That layout matches the default stack with optional desktop smoke and installer packaging files shown for reference. The default stack is TanStack Router, Electrobun RPC, app menu, local navigation rules, Tailwind CSS, and Bun tests. Options can add files such as `src/bun/db/client.ts`, `src/bun/settings/store.ts`, `tests/desktop-smoke.test.ts`, `scripts/package-electrobun.ts`, `components.json`, and `turbo.json`, or omit default files when you choose alternatives like `--router none`, `--app-menu none`, `--packaging none`, or `--testing none`.

## Runtime Model

The generated app has two main parts:

- `src/bun` runs in the Electrobun Bun process.
- `src/views/main` runs in the WebView renderer.

The Bun process creates the window in `src/bun/window.ts`, loads the renderer through `views://`, and optionally attaches typed RPC handlers.

The renderer starts from `src/views/main/main.tsx`, composes providers in `src/views/main/app.tsx`, and renders the starter app from `src/views/main/home.tsx`. With the default TanStack Router stack, the home view is mounted through `src/views/main/routes/index.tsx` and the generated route tree.

Shared types live under `src/shared` so the Bun process and renderer can agree on RPC payloads and domain objects.

## Working In The App

Start development:

```bash
bun run dev
```

The dev script builds the Vite renderer, watches it, and starts Electrobun with `CES_DEV_RELOAD=1` so the WebView reloads when the view output changes.

Build the desktop app:

```bash
bun run build
```

The generated build script runs `vite build` and then `electrobun build` with the selected `--build-env` and `--build-targets` values.

Run checks:

```bash
bun run typecheck
bun run lint
bun test
```

`bun test` exists when the project was created with `--testing bun` or `--testing desktop-smoke`.

## Where To Add Code

Use `src/views/main/home.tsx` as the first place to replace the starter UI.

Add renderer-only components under `src/views/main`. If you use shadcn, add components where your `components.json` aliases point.

Add Bun/native logic under `src/bun`. Keep file system, database, native menu, and Electrobun utility work on this side.

Add shared payload types in `src/shared/types.ts`.

Add RPC contract types in `src/shared/rpc/schema.ts`, handler implementation in `src/bun/rpc/handlers.ts`, and router wiring in `src/bun/rpc/router.ts`.

## Option-Specific Notes

### Routing

With `--frontend react`, all router choices are available.

With `--frontend preact` or `--frontend svelte`, use `--router none`; the generated renderer mounts `Home` directly.

With `--frontend sveltekit`, use `--router none`; the generated SvelteKit app uses SvelteKit file routing under `src/views/main/routes`.

With `--router tanstack-router`, edit files under `src/views/main/routes`. The generated route tree is produced by the TanStack Router Vite plugin.

With `--router react-router`, edit routes in `src/views/main/app.tsx`.

With `--router none`, React and Preact apps render `Home` directly from `src/views/main/app.tsx`; Svelte apps render `Home` from `src/views/main/App.svelte`.

### RPC

With `--api electrobun-rpc`, renderer-to-Bun calls go through the generated typed RPC client in `src/views/main/lib/rpc.ts`.

With `--api none`, the generated app omits BrowserWindow RPC wiring. Add RPC later with `create-electrobun-stack add --api electrobun-rpc` if you want the generator to lay down the bridge files.

### Databases And Drizzle

With `--database sqlite`, the Bun process owns the database client in `src/bun/db/client.ts`.

With `--database json-file`, the Bun process owns a local JSON record store at `data/app-db.json`.

With `--orm drizzle`, use the generated schema in `src/bun/db/schema.ts` and the Drizzle commands in `package.json`.

With `--db-setup seed`, the generated database client inserts starter metadata when the database is empty.

### Settings

With `--settings json`, settings persist to `data/settings.json`.

With `--settings database`, settings persist in SQLite. If Drizzle is enabled, the settings table is also represented in the Drizzle schema.

### Window Chrome And Menu

With `--window-style hidden-inset`, the native window uses hidden inset chrome and the renderer includes a draggable header.

With `--app-menu edit`, `src/bun/menu.ts` installs native edit roles so common text shortcuts work.

### Native Utilities

With `--native-utils file-dialogs`, the generated RPC surface includes `openFileDialog`.

With `--native-utils clipboard`, the generated RPC surface includes clipboard read, write, and clear requests.

With `--native-utils desktop-kit`, both native utility examples are enabled.

### Desktop Smoke Tests

With `--testing desktop-smoke`, `tests/desktop-smoke.test.ts` mocks `electrobun/bun`, imports the generated window code, creates the main window, and verifies launch options without opening a real OS window.

### Installer Packaging

With `--packaging installers`, `scripts/package-electrobun.ts` wraps Electrobun's release artifacts with extra distribution formats. It copies Electrobun artifacts, reuses Electrobun's generated DMG on macOS, builds AppImage and deb packages on Linux, and builds an NSIS wrapper around Electrobun's Windows setup executable on Windows.

The generated packaging commands are:

```bash
bun run package:release
bun run package:linux
bun run package:mac
bun run package:windows
```

These commands expect non-dev Electrobun artifacts. Use `package:release` for a stable build, or run `bun run build` with a canary/stable build channel before a platform-specific packaging command. Linux AppImage packaging requires `appimagetool`, Linux deb packaging requires `dpkg-deb`, and Windows packaging requires `makensis`.

## Manifest

`ces.json` is part of the project contract. Keep it in source control.

It records:

- The generator version.
- The exact reproducible command.
- Project identifiers.
- Selected stack fields.
- Feature booleans used by `create-electrobun-stack add`.

Do not hand-edit `ces.json` unless you are intentionally repairing project metadata. Prefer the `add` command for supported feature growth.

## Production Checklist

Before distributing an app generated by this stack:

- Replace the starter UI and any demo RPC handlers you do not need.
- Confirm `electrobun.config.ts` identifiers and app metadata.
- Choose a build channel with `--build-env` or by editing the generated build script.
- Choose build targets intentionally.
- Run `bun run typecheck`, `bun run lint`, and `bun test` when present.
- Run `bun run build` on the platform you are packaging for.
- If `--packaging installers` is enabled, run the package command on the matching OS runner and inspect `dist/installers`.
- Review local persistence paths and database behavior for your release model.

## Troubleshooting

- Bun version mismatch: install Bun `>=1.3.0` and rerun the generated install command.
- Node engine mismatch: use Node.js `>=20.19.0` when running the published generator through npm or npx.
- Electrobun platform support: run and package generated apps on a desktop OS supported by Electrobun.
- Package manager install failures: rerun the generated install command shown in the README, then rerun typecheck and build.
- Unsupported option combinations: rerun the generator or `add` command with a supported combination from [Stack Options](../reference/options.md).
