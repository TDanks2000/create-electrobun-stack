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
- Typed Electrobun RPC bridge
- Optional starter RPC example through `--examples rpc`

Template source structure:

```txt
templates/minimal/
  base/
    **/*.hbs
  options/
    database/
      sqlite/
        **/*.hbs
    orm/
      drizzle/
        **/*.hbs
```

`base` is always rendered first. Option directories are rendered afterward in stack order, so an option can add new files or override a base/lower-level option file at the same output path. For example, `database/sqlite` adds the raw SQLite client, and `orm/drizzle` overlays that client with a Drizzle-backed version plus `schema.ts` and `drizzle.config.ts`.

The default `--examples rpc` renders a greeting/logging RPC demo in the route, handlers, shared RPC schema, and generated README. Passing `--examples none` keeps the typed RPC bridge and environment request but omits that demo surface.

Generated structure:

```txt
src/
  bun/
    index.ts
    window.ts
    rpc/
      handlers.ts
      router.ts
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

Status: planned.

Planned additions:

- shadcn-style UI components
- Zustand
- TanStack Query
- App settings store
- Custom titlebar

## full

Status: planned.

Planned additions:

- Broader app examples on top of the existing SQLite and Drizzle options
- More complete database workflows
- System tray if it maps cleanly to Electrobun APIs
