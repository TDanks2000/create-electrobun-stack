# Templates

## minimal

Status: implemented.

Includes:

- Electrobun
- Bun
- React
- TanStack Router
- Tailwind CSS or plain CSS
- Strict TypeScript
- Biome
- Electrobun Edit menu through `--app-menu edit`
- Local navigation guard through `--navigation local-only`
- Native or hidden-inset window chrome through `--window-style`
- Optional Bun test scaffold through `--testing bun`
- Optional app lock through `--auth app-lock`
- Optional JSON or database settings persistence through `--settings`
- Optional Turborepo config through `--addons turborepo`
- Typed Electrobun RPC bridge
- Optional starter RPC example through `--examples rpc`
- Root `ces.json` manifest with Better-T-Stack-style stack metadata and feature flags

Template source structure:

```txt
templates/minimal/
  base/
    **/*.hbs
  options/
    app-menu/
      edit/
        **/*.hbs
    addons/
      turborepo/
        **/*.hbs
    database/
      sqlite/
        **/*.hbs
    orm/
      drizzle/
        **/*.hbs
    settings/
      json/
        **/*.hbs
      database/
        **/*.hbs
    testing/
      bun/
        **/*.hbs
```

`base` is always rendered first. Option directories are rendered afterward in stack order, so an option can add new files or override a base/lower-level option file at the same output path. For example, `database/sqlite` adds the raw SQLite client, and `orm/drizzle` overlays that client with a Drizzle-backed version plus `schema.ts` and `drizzle.config.ts`.

The default `--app-menu edit` adds an Electrobun `ApplicationMenu` with standard Edit roles so native copy, paste, undo, redo, and select-all shortcuts work. The default `--navigation local-only` blocks navigation away from bundled `views://` content. Passing `--window-style hidden-inset` adds Electrobun's `titleBarStyle: "hiddenInset"` window option plus a draggable header.

The default `--testing bun` adds `bun test`, includes `tests` in `tsconfig.json`, and renders a generated manifest smoke test. Passing `--testing none` omits the test script and test files.

Passing `--api none` omits BrowserWindow RPC wiring. Passing `--auth app-lock` renders a local app-name lock screen. Passing `--db-setup seed` with SQLite inserts starter metadata when the database is empty. Passing `--addons turborepo` adds `turbo.json`, a `check` script, and the Turbo dev dependency.

Passing `--settings json` adds a Bun-side settings store backed by `data/settings.json`, with VS Code-style dotted keys such as `app.theme`. Passing `--settings database` stores the same key/value settings in SQLite and requires `--database sqlite`. Both settings modes expose `getSettingsStatus` and `updateSetting` through the typed Electrobun RPC bridge.

The default `--examples rpc` renders a greeting/logging RPC demo in the route, handlers, shared RPC schema, and generated README. Passing `--examples none` keeps the typed RPC bridge and environment request but omits that demo surface.

Generated structure:

```txt
ces.json
tests/
  manifest.test.ts
src/
  bun/
    index.ts
    menu.ts
    window.ts
    rpc/
      handlers.ts
      router.ts
    settings/
      store.ts
  views/
    main/
      index.html
      main.tsx
      app.tsx
      routeTree.gen.ts
      routes/
        __root.tsx
        index.tsx
      lib/
        rpc.ts
      styles/
        globals.css
  shared/
    constants.ts
    types.ts
    rpc/
      schema.ts
      types.ts
```

## standard

Status: implemented profile.

Planned additions:

- shadcn-style UI components
- Zustand
- TanStack Query
- App settings store
- Custom titlebar

## full

Status: implemented profile.

Planned additions:

- Broader app examples on top of the existing SQLite and Drizzle options
- More complete database workflows
- System tray if it maps cleanly to Electrobun APIs
