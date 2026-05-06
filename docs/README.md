# create-electrobun-stack

`create-electrobun-stack` scaffolds an Electrobun desktop app with Bun, React, TanStack Router, strict TypeScript, Biome, and typed Electrobun RPC. Tailwind CSS is the default styling option; plain CSS is also supported.

The CLI is designed to feel like `better-t-stack`: pass a project name and optional stack flags. If you do not pass stack options, it uses the current default stack.

## Quick Start

```bash
bunx create-electrobun-stack my-app
cd my-app
bun run dev
```

For local development in this repository:

```bash
bun run src/index.ts my-app
```

By default, the CLI:

- Uses the `minimal` template.
- Installs dependencies with `bun install`.
- Does not initialize git unless `--git` is passed.
- Uses native typed Electrobun RPC rather than custom IPC.
- Includes the starter RPC example unless `--examples none` is passed.

## Default Stack

```bash
--template minimal
--frontend react
--runtime bun
--api electrobun-rpc
--styling tailwindcss
--ui none
--auth none
--database none
--orm none
--db-setup none
--package-manager bun
--addons none
--examples rpc
--install
--no-git
```

## Common Commands

Create and install:

```bash
bunx create-electrobun-stack my-app
```

Create without installing:

```bash
bunx create-electrobun-stack my-app --no-install
```

Preview without writing files:

```bash
bunx create-electrobun-stack my-app --dry-run
```

Create inside a specific directory:

```bash
bunx create-electrobun-stack my-app --cwd ~/Desktop
```

Set the Electrobun app identifier:

```bash
bunx create-electrobun-stack my-app --app-id com.example.myapp
```

Initialize git after scaffolding:

```bash
bunx create-electrobun-stack my-app --git
```

List templates:

```bash
bunx create-electrobun-stack --list-templates
```

## Generated App Commands

```bash
bun run dev
bun run build
bun run typecheck
bun run lint
bun run format
```

## Current Scope

The implemented template is `minimal`. Tailwind CSS and plain CSS are supported, `--ui shadcn` adds shadcn/ui project config when using Tailwind CSS, SQLite is supported, and `--orm drizzle` adds Drizzle ORM when paired with `--database sqlite`. The default `--examples rpc` renders the starter RPC greeting/logging demo; `--examples none` keeps the typed RPC bridge but omits the demo calls and README section. Auth and addons remain planned.

The CLI uses `@clack/prompts` for interactive prompts, spinners, and cancellation handling.
