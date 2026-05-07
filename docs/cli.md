# CLI Reference

## Usage

```bash
bunx create-electrobun-stack <project-name> [options]
```

Local development:

```bash
bun run src/index.ts <project-name> [options]
```

## General Options

| Option | Description |
| --- | --- |
| `--help`, `-h` | Print help. |
| `--version`, `-v` | Print CLI version. |
| `--list-templates` | Print available template profiles. |
| `--dry-run` | Print the resolved scaffold plan without writing files. |
| `--install` | Run `bun install` after scaffolding. Default. |
| `--no-install` | Skip dependency installation. |
| `--git` | Run `git init` after scaffolding. |
| `--no-git` | Do not initialize git. Default. |
| `--cwd <path>` | Scaffold relative to a different parent directory. |
| `--app-id <identifier>` | Override the generated Electrobun app identifier. |
| `--yes`, `-y` | Use defaults and require the project name to be provided. |

## Generated Manifest

The CLI writes `ces.json` in the generated project root. The manifest follows a Better-T-Stack-inspired shape with `$schema`, `version`, `createdAt`, `reproducibleCommand`, project identifiers, flat stack fields such as `database`, `orm`, `settings`, `frontend`, `addons`, `examples`, and `features` booleans for integrations such as `shadcn`, `sqlite`, `drizzle`, `bunTest`, `appLock`, `settingsStore`, and `turborepo`.

## Stack Options

These options intentionally mirror the shape of stack scaffolders like `better-t-stack`.

| Option | Values | Current support |
| --- | --- | --- |
| `--template` | `minimal`, `standard`, `full` | implemented profiles |
| `--frontend` | `react` | implemented |
| `--runtime` | `bun` | implemented |
| `--build-env` | `dev`, `canary`, `stable` | passed to `electrobun build --env` |
| `--build-targets` | `current`, `all` | passed to `electrobun build --targets` |
| `--api` | `electrobun-rpc`, `none` | implemented |
| `--navigation` | `local-only`, `none` | `local-only` blocks non-`views://` navigation |
| `--window-style` | `native`, `hidden-inset` | `hidden-inset` adds macOS titlebar config and a draggable header |
| `--styling` | `tailwindcss`, `css` | implemented |
| `--ui` | `none`, `shadcn` | `shadcn` implemented with Tailwind CSS |
| `--app-menu` | `edit`, `none` | `edit` adds native Edit menu roles for keyboard shortcuts |
| `--auth` | `none`, `app-lock` | `app-lock` adds a local UI lock |
| `--database` | `none`, `sqlite` | implemented |
| `--orm` | `none`, `drizzle` | `drizzle` implemented with SQLite |
| `--db-setup` | `none`, `seed` | `seed` adds starter SQLite metadata |
| `--settings` | `none`, `json`, `database` | `json` adds `data/settings.json`; `database` stores settings in SQLite |
| `--package-manager` | `bun`, `npm`, `pnpm`, `yarn` | controls dependency install command |
| `--testing` | `bun`, `none` | `bun` adds a Bun test script and generated manifest smoke test |
| `--addons` | `none`, `turborepo` | `turborepo` adds `turbo.json` and Turbo scripts |
| `--examples` | `rpc`, `none` | `rpc` renders the starter RPC greeting/logging demo; `none` omits demo calls |

## Examples

Default stack:

```bash
bunx create-electrobun-stack my-app
```

Explicit supported stack:

```bash
bunx create-electrobun-stack my-app \
  --frontend react \
  --runtime bun \
  --build-env dev \
  --build-targets current \
  --api electrobun-rpc \
  --navigation local-only \
  --window-style native \
  --styling tailwindcss \
  --ui shadcn \
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
  --install
```

Create without the Bun test scaffold:

```bash
bunx create-electrobun-stack my-app --testing none
```

Preview optional stack choices:

```bash
bunx create-electrobun-stack my-app \
  --frontend react \
  --auth app-lock \
  --addons turborepo \
  --dry-run
```

Invalid combinations, such as `--db-setup seed` without SQLite, fail before files are written.

Create with a VS Code-style JSON settings file:

```bash
bunx create-electrobun-stack my-app --settings json
```

Create with database-backed settings:

```bash
bunx create-electrobun-stack my-app \
  --database sqlite \
  --settings database
```

Create with SQLite and Drizzle:

```bash
bunx create-electrobun-stack my-app \
  --database sqlite \
  --orm drizzle
```

Create without the starter RPC demo:

```bash
bunx create-electrobun-stack my-app --examples none
```

Create in another parent directory:

```bash
bunx create-electrobun-stack my-app --cwd ~/Desktop
```

Override the app identifier:

```bash
bunx create-electrobun-stack my-app --app-id com.example.myapp
```
