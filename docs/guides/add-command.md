# Add Command

`create-electrobun-stack add` expands an existing generated project by reading `ces.json` and applying new stack options.

## Basic Usage

From the generated project root:

```bash
bunx create-electrobun-stack add --orm drizzle
```

From another directory:

```bash
bunx create-electrobun-stack add --cwd my-app --settings database
```

Skip dependency installation:

```bash
bunx create-electrobun-stack add --cwd my-app --ui shadcn --no-install
```

## How It Works

1. Reads `ces.json` from the project root.
2. Reconstructs the current stack from manifest fields and feature booleans.
3. Applies only the stack flags you passed.
4. Infers prerequisites when possible.
5. Rejects non-additive or unsupported changes.
6. Renders the base template and option overlays into the existing project.
7. Writes an updated `ces.json`.
8. Installs dependencies unless `--no-install` is used.

The command preserves the original `createdAt` value in `ces.json`.

## Additive Changes

Supported additive changes include:

- `--api none` to `--api electrobun-rpc`
- `--app-menu none` to `--app-menu edit`
- `--auth none` to `--auth app-lock`
- `--database none` to `--database sqlite`
- `--db-setup none` to `--db-setup seed`
- `--examples none` to `--examples rpc`
- `--navigation none` to `--navigation local-only`
- `--native-utils none` to `--native-utils file-dialogs`
- `--orm none` to `--orm drizzle`
- `--settings none` to `--settings json` or `--settings database`
- `--styling css` to `--styling tailwindcss`
- `--testing none` to `--testing bun`
- `--ui none` to `--ui shadcn`
- `--window-style native` to `--window-style hidden-inset`
- `--query none` to `--query tanstack-query`
- `--router none` to `--router tanstack-router` or `--router react-router`
- `--addons none` to `--addons turborepo`
- `--packaging none` to `--packaging installers`

The command does not remove features. It also does not change `frontend`, `runtime`, `packageManager`, `buildEnv`, or `buildTargets`.

## Inferred Prerequisites

The `add` command can infer prerequisites for common growth paths:

| Requested option | Inferred option |
| --- | --- |
| `--orm drizzle` | `--database sqlite` |
| `--db-setup seed` | `--database sqlite` |
| `--settings database` | `--database sqlite` and `--api electrobun-rpc` |
| `--settings json` | `--api electrobun-rpc` |
| `--examples rpc` | `--api electrobun-rpc` |
| `--native-utils file-dialogs` | `--api electrobun-rpc` |
| `--ui shadcn` | `--styling tailwindcss` |

If you explicitly pass an invalid combination, validation still fails. For example, `--database none --orm drizzle` is rejected.

## Examples

Add SQLite:

```bash
bunx create-electrobun-stack add --database sqlite
```

Add Drizzle, inferring SQLite if needed:

```bash
bunx create-electrobun-stack add --orm drizzle
```

Add database-backed settings, inferring SQLite and Electrobun RPC if needed:

```bash
bunx create-electrobun-stack add --settings database
```

Add shadcn config, inferring Tailwind CSS if needed:

```bash
bunx create-electrobun-stack add --ui shadcn
```

Add the native file dialog RPC utility:

```bash
bunx create-electrobun-stack add --native-utils file-dialogs
```

Add installer packaging helpers:

```bash
bunx create-electrobun-stack add --packaging installers
```

## Conflict Behavior

The add command protects existing generated projects from destructive stack changes. These are rejected:

- Switching `react-router` to `tanstack-router`.
- Removing SQLite, Drizzle, settings, tests, examples, or UI config.
- Switching package managers.
- Changing build channels or targets.
- Replacing a generated app without `ces.json`.

For those changes, create a new project with the desired stack or migrate manually.
