# create-electrobun-stack

[![npm version](https://img.shields.io/npm/v/create-electrobun-stack.svg)](https://www.npmjs.com/package/create-electrobun-stack)
[![npm downloads](https://img.shields.io/npm/dm/create-electrobun-stack.svg)](https://www.npmjs.com/package/create-electrobun-stack)
[![Node version](https://img.shields.io/node/v/create-electrobun-stack.svg)](https://www.npmjs.com/package/create-electrobun-stack)
[![Bun >=1.3.0](https://img.shields.io/badge/Bun-%3E%3D1.3.0-000?logo=bun&logoColor=white)](https://bun.sh)

Scaffold a production-minded Electrobun desktop app with Bun, React, TypeScript, Vite, Biome, typed Electrobun RPC, and a small set of optional integrations that can be enabled at create time or added later.

The generator is intentionally explicit: every selected stack option is written to `ces.json`, the generated project README explains what was scaffolded, and the `add` command can use that manifest to enable missing features without asking you to remember the original command.

## Quick Start

```bash
npm create electrobun-stack@latest my-app
cd my-app
bun run dev
```

You can also run it with `npx create-electrobun-stack@latest my-app`, `bunx --bun create-electrobun-stack@latest my-app`, or install it globally with `npm install -g create-electrobun-stack`.

Requirements:

- Node.js `>=20.19.0` to run the published CLI.
- Bun `>=1.3.0`.
- A desktop OS supported by Electrobun for running or building generated apps.

Use the local command while developing this repository:

```bash
bun run src/index.ts my-app
```

## Default Stack

The default project is a Bun-powered Electrobun app with:

- React renderer built with Vite.
- TanStack Router file routes.
- Tailwind CSS v4.
- Typed Electrobun RPC between the Bun process and the WebView.
- Native Edit menu shortcuts.
- Local-only navigation rules for bundled views.
- Bun test scaffold.
- Biome formatting and linting.
- A starter RPC example.
- A `ces.json` manifest with a reproducible command and feature flags.

Equivalent flags:

```bash
bunx create-electrobun-stack my-app \
  --template minimal \
  --frontend react \
  --router tanstack-router \
  --query none \
  --runtime bun \
  --build-env dev \
  --build-targets current \
  --api electrobun-rpc \
  --navigation local-only \
  --native-utils none \
  --window-style native \
  --styling tailwindcss \
  --ui none \
  --app-menu edit \
  --auth none \
  --database none \
  --orm none \
  --db-setup none \
  --settings none \
  --package-manager bun \
  --testing bun \
  --addons none \
  --examples rpc \
  --install \
  --no-git
```

## Common Recipes

Create without installing dependencies:

```bash
bunx create-electrobun-stack my-app --no-install
```

Preview the resolved stack without writing files:

```bash
bunx create-electrobun-stack my-app --dry-run
```

Create with SQLite, Drizzle, and database-backed settings:

```bash
bunx create-electrobun-stack my-app \
  --database sqlite \
  --orm drizzle \
  --settings database
```

Create a simpler renderer with React Router and TanStack Query:

```bash
bunx create-electrobun-stack my-app \
  --router react-router \
  --query tanstack-query
```

Start small and add a feature later:

```bash
cd my-app
bunx create-electrobun-stack add --orm drizzle
```

`add` reads `ces.json`, infers prerequisites such as SQLite for Drizzle, updates the scaffolded files, and refreshes the manifest.

## Generated Commands

Most generated projects expose:

```bash
bun run dev
bun run build
bun run typecheck
bun run lint
bun run format
bun test
```

Some options add commands. For example, `--addons turborepo` adds `bun run check`, and `--orm drizzle` adds Drizzle scripts.

## Docs

- [Docs index](./docs/README.md): where to start.
- [CLI reference](./docs/reference/cli.md): every command and operational flag.
- [Stack options](./docs/reference/options.md): what each option adds and where to find it after scaffolding.
- [Manifest reference](./docs/reference/manifest.md): `ces.json` fields and schema.
- [Generated project guide](./docs/guides/generated-project.md): file structure, app lifecycle, and maintenance workflow.
- [Add command](./docs/guides/add-command.md): how to grow an existing generated app.
- [Templates](./docs/internals/templates.md): how template overlays are organized.
- [V1 release plan](./docs/roadmap/v1-plan.md): release gates for moving from pre-release to `1.0.0`.
- [LLM guide](./docs/llm.txt): compact agent-oriented reference.

## Development

```bash
bun install
bun run build
bun test
bun run typecheck
bun run lint
bun run validate:render
npm pack --dry-run
```

The CLI entrypoint is `src/index.ts`. Stack choices live in `src/options.ts`, manifest generation lives in `src/manifest.ts`, and template rendering lives in `src/scaffold.ts`.

The published npm package ships the built CLI from `dist/index.mjs` plus `templates/` and `docs/`. Run `bun run build` before local package checks; `npm pack --dry-run` also runs the build through `prepack`. The bin keeps a Node shebang for npm compatibility; `bunx --bun create-electrobun-stack@latest` forces Bun to run the same built CLI.

Release checks:

```bash
bun run validate
bun run pack:smoke
```

`bun run validate:render` scaffolds the representative V1 matrix and runs Biome against the rendered output without installing generated dependencies. `bun run validate` performs the slower release gate: it installs each generated project and runs typecheck, lint, tests when present, and build. `bun run pack:smoke` proves the packed tarball can be installed and used through its published bin.
