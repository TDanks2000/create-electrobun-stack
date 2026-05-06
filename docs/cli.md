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
| `--list-templates` | Print implemented and planned templates. |
| `--dry-run` | Print the resolved scaffold plan without writing files. |
| `--install` | Run `bun install` after scaffolding. Default. |
| `--no-install` | Skip dependency installation. |
| `--git` | Run `git init` after scaffolding. |
| `--no-git` | Do not initialize git. Default. |
| `--cwd <path>` | Scaffold relative to a different parent directory. |
| `--app-id <identifier>` | Override the generated Electrobun app identifier. |
| `--yes`, `-y` | Use defaults and require the project name to be provided. |

## Stack Options

These options intentionally mirror the shape of stack scaffolders like `better-t-stack`.

| Option | Values | Current support |
| --- | --- | --- |
| `--template` | `minimal`, `standard`, `full` | `minimal` implemented |
| `--frontend` | `react`, `next`, `none` | `react` implemented |
| `--runtime` | `bun` | implemented |
| `--api` | `electrobun-rpc`, `trpc`, `none` | `electrobun-rpc` implemented |
| `--styling` | `tailwindcss`, `css` | implemented |
| `--ui` | `none`, `shadcn` | `shadcn` implemented with Tailwind CSS |
| `--auth` | `none`, `better-auth` | `none` implemented |
| `--database` | `none`, `sqlite` | implemented |
| `--orm` | `none`, `drizzle` | `drizzle` implemented with SQLite |
| `--db-setup` | `none` | implemented |
| `--package-manager` | `bun` | implemented |
| `--addons` | `none`, `turborepo` | `none` implemented |
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
  --api electrobun-rpc \
  --styling tailwindcss \
  --ui shadcn \
  --auth none \
  --database none \
  --orm none \
  --db-setup none \
  --package-manager bun \
  --addons none \
  --examples rpc \
  --install
```

Preview planned full-stack options:

```bash
bunx create-electrobun-stack my-app \
  --frontend react \
  --auth better-auth \
  --addons turborepo \
  --dry-run
```

Without `--dry-run`, planned but unimplemented options fail before files are written.

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
