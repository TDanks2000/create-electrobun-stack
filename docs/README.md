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
- Adds an Electrobun Edit menu for native copy/paste shortcuts unless `--app-menu none` is passed.
- Blocks non-`views://` renderer navigation unless `--navigation none` is passed.
- Includes the starter RPC example unless `--examples none` is passed.
- Includes a Bun test scaffold unless `--testing none` is passed.
- Supports optional app lock auth, seed data, Turborepo task running, static API mode, and multiple package managers.
- Writes `ces.json` in the generated project root with Better-T-Stack-style metadata, a reproducible command, selected stack fields, and feature flags for future CLI commands.

## Default Stack

```bash
--template minimal
--frontend react
--runtime bun
--build-env dev
--build-targets current
--api electrobun-rpc
--navigation local-only
--window-style native
--styling tailwindcss
--ui none
--app-menu edit
--auth none
--database none
--orm none
--db-setup none
--package-manager bun
--testing bun
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
bun test
bun run typecheck
bun run lint
bun run format
```

## Generated Manifest

Every generated project includes `ces.json` at the project root. It uses a Better-T-Stack-inspired shape with `$schema`, `version`, `createdAt`, `reproducibleCommand`, project identifiers, flat stack fields such as `database`, `orm`, `frontend`, `addons`, `examples`, and a `features` map for future add-command checks.

## Current Scope

The implemented templates are `minimal`, `standard`, and `full`; `standard` and `full` currently use the same stable Electrobun template profile while keeping their manifest identity. Tailwind CSS and plain CSS are supported, `--ui shadcn` adds shadcn/ui project config when using Tailwind CSS, SQLite is supported, `--db-setup seed` adds starter metadata, and `--orm drizzle` adds Drizzle ORM when paired with `--database sqlite`. `--api none` omits runtime RPC wiring, `--auth app-lock` adds a local UI lock, and `--addons turborepo` adds Turbo task config. Electrobun-specific options include `--app-menu edit|none`, `--navigation local-only|none`, `--window-style native|hidden-inset`, `--build-env dev|canary|stable`, and `--build-targets current|all`. The default `--testing bun` adds a Bun test script and manifest smoke test; `--testing none` omits it. The default `--examples rpc` renders the starter RPC greeting/logging demo; `--examples none` keeps the typed RPC bridge but omits the demo calls and README section.

The CLI uses `@clack/prompts` for interactive prompts, spinners, and cancellation handling.
