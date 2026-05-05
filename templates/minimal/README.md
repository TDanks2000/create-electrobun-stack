# __APP_NAME__

Generated with `create-electrobun-stack`.

## Commands

```bash
bun install
bun run dev
bun run build
bun run typecheck
bun run lint
bun run format
```

## Stack

- Electrobun
- Bun
- React
- TanStack Router
- Tailwind CSS
- Typed Electrobun RPC
- Strict TypeScript
- Biome

## RPC Example

Shared RPC types live in `src/shared/rpc/schema.ts`.

The Bun main process registers handlers in `src/bun/rpc/router.ts`.

The renderer creates the WebView RPC client in `src/views/main/lib/rpc.ts`.
