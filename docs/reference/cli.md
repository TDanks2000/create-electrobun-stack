# CLI Reference

## Usage

```bash
npm create electrobun-stack@latest <project-name> [options]
npx create-electrobun-stack@latest <project-name> [options]
bunx --bun create-electrobun-stack@latest <project-name> [options]
create-electrobun-stack <project-name> [options]
create-electrobun-stack add [options]
```

Local development inside this repository:

```bash
bun run src/index.ts <project-name> [options]
bun run src/index.ts add --cwd <project-directory> [options]
```

The npm package exposes `create-electrobun-stack` from the built `dist/index.mjs` file. Plain npm and npx execution require Node.js `>=20.19.0`; `bunx --bun create-electrobun-stack@latest` forces Bun to run the same bin. Use `npm install -g create-electrobun-stack` if you want the global command.

## V1 Public Contract

V1 supports two command shapes:

- `create-electrobun-stack <project-name> [options]`
- `create-electrobun-stack add [options]`

The supported operational flags are `--dry-run`, `--yes`, `--cwd`, `--app-id`, `--install`, `--no-install`, `--git`, `--no-git`, `--list-templates`, `--version`, and `--help`.

The supported stack flags are the flags listed in the Stack Options and Electrobun Feature Options tables below. New flags may be added in minor releases, but V1-compatible generators should not silently change or remove these command shapes.

For V1, `minimal` is the canonical template. `standard` and `full` remain accepted aliases for compatibility and manifest identity, but they intentionally render the same file set as `minimal`.

## Commands

### Create

`create` is the default command. Pass a project name and optional stack flags:

```bash
bunx create-electrobun-stack my-app --router tanstack-router --styling tailwindcss
```

If a project name is omitted in an interactive terminal, the CLI prompts for one. In non-interactive mode, or when using `--yes`, the project name is required.

The target directory may not contain files. Empty existing directories are allowed.

### Add

`add` expands an existing generated project:

```bash
cd my-app
bunx create-electrobun-stack add --database sqlite --orm drizzle
```

The command reads `ces.json`, applies only the flags you pass, infers required prerequisites, writes the missing template files, and refreshes `ces.json`.

`add` can enable missing features. It does not remove features, switch package managers, change build channels, or replace one router with another.

## Operational Options

| Option | Default | Description |
| --- | --- | --- |
| `--help`, `-h` | off | Print CLI help. |
| `--version`, `-v` | off | Print the package version. |
| `--list-templates` | off | Print available template profiles. |
| `--dry-run` | off | Print the resolved plan without writing files. |
| `--yes`, `-y` | off | Use defaults for omitted options. Requires a project name. |
| `--cwd <path>` | current directory | Create under another parent directory, or point `add` at an existing project. |
| `--app-id <identifier>` | generated from package name | Override the Electrobun reverse-DNS app identifier. |
| `--install` | on | Install dependencies after writing files. |
| `--no-install` | off | Skip dependency installation. |
| `--git` | off | Initialize a git repository after scaffolding. |
| `--no-git` | on | Do not initialize git. |

`--app-id` must be reverse-DNS style, for example `com.example.myapp`.

## Stack Options

| Option | Values | Default |
| --- | --- | --- |
| `--template` | `minimal`, `standard`, `full` | `minimal` |
| `--frontend` | `react`, `preact`, `svelte`, `sveltekit` | `react` |
| `--router` | `tanstack-router`, `react-router`, `none` | `tanstack-router` |
| `--query` | `none`, `tanstack-query` | `none` |
| `--runtime` | `bun` | `bun` |
| `--styling` | `tailwindcss`, `css` | `tailwindcss` |
| `--ui` | `none`, `shadcn` | `none` |
| `--auth` | `none`, `app-lock` | `none` |
| `--database` | `none`, `sqlite`, `json-file` | `none` |
| `--orm` | `none`, `drizzle` | `none` |
| `--db-setup` | `none`, `seed` | `none` |
| `--settings` | `none`, `json`, `database` | `none` |
| `--package-manager` | `bun`, `npm`, `pnpm`, `yarn` | `bun` |
| `--packaging` | `none`, `installers` | `none` |
| `--testing` | `bun`, `desktop-smoke`, `none` | `bun` |
| `--addons` | `none`, `turborepo` | `none` |
| `--examples` | `rpc`, `none` | `rpc` |

## Electrobun Feature Options

| Option | Values | Default |
| --- | --- | --- |
| `--api` | `electrobun-rpc`, `none` | `electrobun-rpc` |
| `--navigation` | `local-only`, `none` | `local-only` |
| `--native-utils` | `none`, `file-dialogs`, `clipboard`, `desktop-kit` | `none` |
| `--window-style` | `native`, `hidden-inset` | `native` |
| `--app-menu` | `edit`, `none` | `edit` |
| `--build-env` | `dev`, `canary`, `stable` | `dev` |
| `--build-targets` | `current`, `all` | `current` |

## Valid Combinations

The CLI fails before files are written when unsupported combinations are selected:

- `--orm drizzle` requires `--database sqlite`.
- `--db-setup seed` requires a generated database.
- `--settings database` requires `--database sqlite`.
- `--settings json` and `--settings database` require `--api electrobun-rpc`.
- `--native-utils file-dialogs` requires `--api electrobun-rpc`.
- `--native-utils clipboard` and `--native-utils desktop-kit` require `--api electrobun-rpc`.
- `--examples rpc` requires `--api electrobun-rpc`.
- `--ui shadcn` requires `--styling tailwindcss` and `--frontend react`.
- `--frontend preact`, `--frontend svelte`, and `--frontend sveltekit` currently require `--router none`, `--query none`, and `--ui none`.

The `add` command can infer some prerequisites. For example, `add --orm drizzle` enables SQLite if it was missing, and `add --ui shadcn` enables Tailwind CSS if the app was created with plain CSS.

## Examples

Default stack:

```bash
bunx create-electrobun-stack my-app
```

Non-interactive default stack:

```bash
bunx create-electrobun-stack my-app --yes
```

Create without installation:

```bash
bunx create-electrobun-stack my-app --no-install
```

Dry run:

```bash
bunx create-electrobun-stack my-app --dry-run
```

Create in another parent directory:

```bash
bunx create-electrobun-stack my-app --cwd ~/Desktop
```

Use React Router and TanStack Query:

```bash
bunx create-electrobun-stack my-app \
  --router react-router \
  --query tanstack-query
```

Use Preact with direct rendering:

```bash
bunx create-electrobun-stack my-app \
  --frontend preact \
  --router none
```

Use Svelte with direct rendering:

```bash
bunx create-electrobun-stack my-app \
  --frontend svelte \
  --router none
```

Use SvelteKit with static file routing:

```bash
bunx create-electrobun-stack my-app \
  --frontend sveltekit \
  --router none
```

Use plain CSS and no renderer router:

```bash
bunx create-electrobun-stack my-app \
  --router none \
  --styling css
```

Use SQLite and Drizzle:

```bash
bunx create-electrobun-stack my-app \
  --database sqlite \
  --orm drizzle
```

Use JSON-file persistence:

```bash
bunx create-electrobun-stack my-app \
  --database json-file \
  --db-setup seed
```

Use SQLite-backed settings:

```bash
bunx create-electrobun-stack my-app \
  --database sqlite \
  --settings database
```

Use JSON settings:

```bash
bunx create-electrobun-stack my-app --settings json
```

Use a native file dialog example:

```bash
bunx create-electrobun-stack my-app --native-utils file-dialogs
```

Use native clipboard plus file dialogs:

```bash
bunx create-electrobun-stack my-app --native-utils desktop-kit
```

Add installer packaging helpers:

```bash
bunx create-electrobun-stack my-app --packaging installers
```

Add desktop launch smoke tests:

```bash
bunx create-electrobun-stack my-app --testing desktop-smoke
```

Use hidden inset window chrome:

```bash
bunx create-electrobun-stack my-app --window-style hidden-inset
```

Create a cleaner starter without demo RPC calls:

```bash
bunx create-electrobun-stack my-app --examples none
```

Add Drizzle later:

```bash
bunx create-electrobun-stack add --orm drizzle
```

Add database-backed settings later:

```bash
bunx create-electrobun-stack add --settings database
```

## Generated Commands

The generated README is tailored to the selected package manager. With Bun, the common commands are:

```bash
bun install
bun run dev
bun run build
bun run typecheck
bun run lint
bun run format
bun test
```

Options may add commands:

- `--addons turborepo` adds `bun run check`.
- `--orm drizzle` adds `bun run db:generate` and `bun run db:studio`.
- `--packaging installers` adds `bun run package:release`, `bun run package:linux`, `bun run package:mac`, and `bun run package:windows`.
- `--testing desktop-smoke` keeps `bun test` and adds `tests/desktop-smoke.test.ts`.
- `--testing none` omits `bun test`.
