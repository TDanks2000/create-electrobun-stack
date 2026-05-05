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
| `--backend` | `electrobun`, `hono`, `none` | `electrobun` implemented |
| `--runtime` | `bun` | implemented |
| `--api` | `electrobun-rpc`, `trpc`, `none` | `electrobun-rpc` implemented |
| `--auth` | `none`, `better-auth` | `none` implemented |
| `--payments` | `none` | implemented |
| `--database` | `none`, `sqlite` | `none` implemented |
| `--orm` | `none`, `drizzle` | `none` implemented |
| `--db-setup` | `none` | implemented |
| `--package-manager` | `bun` | implemented |
| `--web-deploy` | `none` | implemented |
| `--server-deploy` | `none` | implemented |
| `--addons` | `none`, `turborepo` | `none` implemented |
| `--examples` | `rpc`, `none` | parsed; minimal includes RPC example |

## Examples

Default stack:

```bash
bunx create-electrobun-stack my-app
```

Explicit supported stack:

```bash
bunx create-electrobun-stack my-app \
  --frontend react \
  --backend electrobun \
  --runtime bun \
  --api electrobun-rpc \
  --auth none \
  --payments none \
  --database none \
  --orm none \
  --db-setup none \
  --package-manager bun \
  --web-deploy none \
  --server-deploy none \
  --addons none \
  --examples rpc \
  --install
```

Preview planned full-stack options:

```bash
bunx create-electrobun-stack my-app \
  --frontend react \
  --backend electrobun \
  --database sqlite \
  --orm drizzle \
  --dry-run
```

Without `--dry-run`, planned but unimplemented options fail before files are written.

Create in another parent directory:

```bash
bunx create-electrobun-stack my-app --cwd ~/Desktop
```

Override the app identifier:

```bash
bunx create-electrobun-stack my-app --app-id com.example.myapp
```
