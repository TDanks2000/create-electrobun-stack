# Templates

## minimal

Status: implemented.

Includes:

- Electrobun
- Bun
- React
- TanStack Router
- Tailwind CSS
- Strict TypeScript
- Biome
- Typed Electrobun RPC example

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

- Drizzle ORM
- SQLite
- Example database schema
- Database client
- RPC methods that read and write local SQLite data
- System tray if it maps cleanly to Electrobun APIs
