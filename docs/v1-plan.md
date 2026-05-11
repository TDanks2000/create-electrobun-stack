# V1 Release Plan

This plan moves `create-electrobun-stack` from the current pre-1.0 package to a stable `1.0.0` release.

## Current Baseline

- Latest published npm version: `0.1.1`.
- The package builds to `dist/index.mjs` with `tsdown`.
- The CLI package includes `dist`, `docs`, and `templates`.
- CI runs lint, typecheck, tests, build, and package dry-run.
- Publishing is wired through the GitHub release workflow.
- Local release gates now include `bun run validate`, `bun run validate:render`, and `bun run pack:smoke`.
- The default stack is a Bun-powered Electrobun app with React, Vite, Tailwind CSS, TanStack Router, typed RPC, Biome, Bun tests, app menu, local navigation rules, and a `ces.json` manifest.

## V1 Definition

V1 means the CLI can be recommended for new projects without caveats around package install, generated app correctness, or manifest compatibility.

The release is ready when:

- The published CLI works through `npm create`, `npx`, and `bunx --bun`.
- Existing option categories feel complete enough for V1 without adding new categories just to increase surface area.
- Every documented stack option is covered by tests or a deliberate manual verification checklist.
- Generated projects can install dependencies, run development commands, typecheck, lint, test, and build for the supported option matrix.
- `ces.json` has a stable compatibility story for future `add` operations.
- The docs match the shipped behavior and explain the supported boundaries clearly.
- The release process can produce `1.0.0` from a GitHub release without manual package surgery.

## Phase 1: Stabilize The Public Contract

Goal: decide what V1 promises and avoid accidental breaking changes after release.

Status: completed in the repo. Evidence lives in `docs/cli.md`, `docs/options.md`, `docs/manifest.md`, `docs/add-command.md`, `src/cli.ts`, `src/prompts.ts`, and `tests/cli.test.ts`.

- Freeze the V1 CLI command shape:
  - `create-electrobun-stack <project>`
  - `create-electrobun-stack add`
  - `--dry-run`, `--yes`, `--cwd`, `--install`, `--git`, and stack flags.
- Mark the V1-supported stack options in `docs/options.md`.
- Decide whether `minimal`, `standard`, and `full` should remain aliases for V1 or whether only `minimal` should be advertised.
- Document the compatibility rules for `ces.json`:
  - V1 manifests are additive.
  - Existing generated apps should keep working with future `add` features.
  - Breaking manifest migrations require a documented migration path.
- Add a short compatibility policy to `docs/manifest.md`.

Exit criteria:

- Docs clearly say what is supported in V1.
- Any accepted-but-equivalent template profiles are documented as aliases or hidden from the primary examples.
- No user-facing flag is left ambiguous.

## Phase 2: Expand Existing Option Categories

Goal: make the stack chooser feel complete before V1 without adding new categories or padding the CLI with weak options.

Status: scoped for V1. The option set includes multiple meaningful choices in the categories that are ready for V1, and intentionally narrow categories are documented in `docs/options.md`. Post-V1 option expansion is tracked in GitHub issue #3.

Use these rules for the V1 option depth pass:

- Add options only inside existing categories.
- Prefer options with clear generated-file differences over cosmetic aliases.
- Do not add a choice unless it can install, typecheck, lint, test when applicable, and build.
- Keep every new option additive through `create-electrobun-stack add` when that makes sense.
- If a category remains single-choice, document why it is intentionally fixed for V1.

Candidate options to evaluate:

| Category | Current options | V1 candidates |
| --- | --- | --- |
| Template | `minimal`, `standard`, `full` aliases | Make `standard` and `full` distinct profiles, or remove them from primary docs until they differ. |
| Frontend | `react` | Add `preact` or `vue` only if generated Electrobun/Vite projects stay low-maintenance. |
| Router | `tanstack-router`, `react-router`, `none` | Add a lightweight router option only if it meaningfully differs from `none` and React Router. |
| Query | `tanstack-query`, `none` | Consider `swr` for a smaller client-side data option. |
| Styling | `tailwindcss`, `css` | Consider CSS Modules or UnoCSS if the generated app remains simple. |
| UI | `shadcn`, `none` | Consider a lightweight accessible component starter, but avoid a large design-system commitment before V1. |
| Auth | `app-lock`, `none` | Add a stronger local PIN/password lock flow if it fits desktop-only auth. |
| Database | `sqlite`, `none` | Consider an embedded JSON/file-store option if it is meaningfully different from settings storage. |
| ORM | `drizzle`, `none` | Consider keeping this as-is unless a second ORM has clear Electrobun value. |
| DB setup | `seed`, `none` | Add migrations/bootstrap options if they work with SQLite and Drizzle. |
| Settings | `json`, `database`, `none` | Consider encrypted local settings or typed preferences examples. |
| Package manager | `bun`, `npm`, `pnpm`, `yarn` | Already full enough for V1. |
| Testing | `bun`, `none` | Add Playwright only if the generated app can run it reliably in CI. |
| Addons | `turborepo`, `none` | Add editor config, GitHub Actions, or Docker only if each produces concrete generated files. |
| Examples | `rpc`, `none` | Add settings, database, file-dialog, or routing examples tied to selected options. |
| API | `electrobun-rpc`, `none` | Consider a static preload/helper option only if it fits Electrobun's model. |
| App menu | `edit`, `none` | Add app/about or file menu presets. |
| Build env | `dev`, `canary`, `stable` | Already full enough for V1. |
| Build targets | `current`, `all` | Consider explicit platform sets only if Electrobun packaging supports them cleanly. |
| Navigation | `local-only`, `none` | Add external-link-open-in-browser behavior if it is safe by default. |
| Native utils | `file-dialogs`, `none` | Add clipboard, shell-open, notifications, or path helpers as separate choices if Electrobun supports them cleanly. |
| Window style | `native`, `hidden-inset` | Add frameless or custom titlebar only if keyboard/window controls remain correct on supported OSes. |
| Runtime | `bun` | Keep fixed for V1 unless Electrobun supports another runtime; document it as an intentional constraint. |

Recommended V1 minimum:

- Make `standard` and `full` distinct or stop advertising them as real choices.
- Add at least one substantial option to two sparse categories, with `native-utils`, `examples`, `app-menu`, `settings`, and `testing` as the best first candidates.
- Document categories that should stay narrow for V1, especially `runtime`, `frontend`, `database`, and `orm` if they remain single-choice.

Exit criteria:

- Every existing category has either multiple useful choices or a documented reason it stays narrow for V1.
- New option work is represented in `src/options.ts`, templates, manifest/schema docs, CLI docs, generated-project docs, and tests.
- The full validation matrix includes every new option at least once.

## Phase 3: Prove Generated Projects Work

Goal: test real generated projects, not just renderer template output.

Status: implemented locally. `tests/cli.test.ts` keeps the fast parser, manifest, add-command, and template-render behavior covered. `scripts/validate-generated-projects.ts` scaffolds the representative matrix below; `bun run validate:render` runs the fast render check in CI, and `bun run validate` runs dependency install plus typecheck, lint, tests when present, and build for release validation.

- Add integration tests that scaffold representative projects into temp directories.
- For each representative project, run:
  - dependency installation with the selected package manager when practical,
  - `bun run typecheck`,
  - `bun run lint`,
  - `bun test` when test scaffolding is enabled,
  - `bun run build`.
- Cover the default stack as the highest-priority path.
- Cover at least these option combinations:
  - default stack,
  - `--router react-router --query tanstack-query`,
  - `--router none --styling css --examples none`,
  - `--database sqlite --orm drizzle --settings database`,
  - `--native-utils file-dialogs --window-style hidden-inset`,
  - `--addons turborepo`,
  - `--ui shadcn`.
- Keep fast unit tests for parser, manifest, and template behavior.
- Add slower generated-project validation behind a separate script, for example `bun run validate`.

Exit criteria:

- CI runs the fast suite on every PR.
- A full generated-project validation command exists and passes before release.
- Failures identify the selected stack combination, generated path, and command that failed.

## Phase 4: Harden Package Publishing

Goal: make npm release boring.

Status: completed for local and workflow dry-run gates. `bun run pack:check` verifies package contents, and `bun run pack:smoke` packs the tarball, installs it into a temp consumer project, checks `--version`, dry-runs a scaffold, and scaffolds a real app without installing generated dependencies. The publish workflow supports GitHub releases and `workflow_dispatch` dry runs, resolves prerelease publishes to the `next` npm dist-tag by default, and uses npm trusted publishing through GitHub Actions OIDC instead of long-lived npm token secrets. The `Publish` workflow dry run for `a9777406d914a43c89376705f4ffdb5927961fda` passed in GitHub Actions run `25640509300`; `Publish to npm` was skipped and `Skip publish` succeeded.

- Confirm `npm pack --dry-run` includes only intended files.
- Add package smoke tests against the packed tarball:
  - install the tarball into a temp project,
  - run `create-electrobun-stack --version`,
  - scaffold with `--dry-run`,
  - scaffold a real app without dependency install.
- Decide whether V1 publishes only from GitHub releases or also supports manual `workflow_dispatch`.
- Configure npm trusted publishing for GitHub Actions with repository `TDanks2000/create-electrobun-stack` and workflow filename `publish.yml`.
- Add release notes guidance for `0.x -> 1.0.0`.
- Add a `CHANGELOG.md` before the first release candidate.

Exit criteria:

- A local or CI script proves the packed package works before publish.
- The publish workflow has been tested with a dry run.
- Release notes have a repeatable format.

## Phase 5: Documentation Pass

Goal: make the first-run path clear and keep generated project docs accurate.

Status: completed for the pre-RC documentation pass. The V1 public contract, option boundaries, manifest compatibility, generated-project lifecycle, troubleshooting notes, release checks, and changelog are represented in docs. The generated-project guide now reflects the actual default layout, including route, menu, and test files. The final pass should be repeated after RC feedback and before `1.0.0`.

- Verify root README commands against the packed package.
- Keep `docs/cli.md` aligned with `parseArgs`.
- Keep `docs/options.md` aligned with `src/options.ts`.
- Keep `docs/manifest.md` and `docs/ces.schema.json` aligned with generated manifests.
- Make `docs/generated-project.md` describe the actual default app lifecycle.
- Update `docs/llm.txt` after any option or behavior change.
- Add troubleshooting notes for:
  - Bun version mismatch,
  - Node engine mismatch,
  - Electrobun platform support,
  - package manager install failures,
  - unsupported option combinations.

Exit criteria:

- A new user can follow the README from install to generated app without needing source context.
- Every public option has one canonical doc location.
- Generated docs do not mention planned-but-unshipped features as current behavior.

## Phase 6: Release Candidate

Goal: publish a real prerelease and use it like a user.

- Bump to a fresh RC version. The current prepared candidate is `1.0.0-rc.3` because `v1.0.0-rc.2` was released before the corrected prerelease npm dist-tag workflow could publish.
- Publish under an npm prerelease tag, for example `next`.
- Test the published prerelease with:
  - `npm create electrobun-stack@next my-app`,
  - `npx create-electrobun-stack@next my-app`,
  - `bunx --bun create-electrobun-stack@next my-app`.
- Generate projects on at least macOS, Linux, and Windows if contributors have access.
- Track any RC findings as GitHub issues.
- Avoid new V1 scope unless it fixes correctness, docs, or release confidence.

Exit criteria:

- At least one RC has been published and tested from npm.
- All release-blocking RC issues are closed.
- The final V1 diff is limited to version, changelog, docs, or release fixes.

## Phase 7: V1 Release

Goal: ship `1.0.0` with a clear support boundary.

- Bump package version to `1.0.0`.
- Update manifest examples and schema URLs that include the package version.
- Update `CHANGELOG.md` with the V1 summary and migration notes.
- Run the full release gate:
  - `bun install --frozen-lockfile`,
  - `bun run lint`,
  - `bun run typecheck`,
  - `bun test`,
  - `bun run build`,
  - `bun run pack:check`,
  - generated-project validation,
  - packed-package smoke test.
- Create a GitHub release for `v1.0.0`.
- Confirm npm shows `1.0.0` as latest.
- Create a post-release issue list for `1.1.0` improvements.

Exit criteria:

- GitHub release exists for `v1.0.0`.
- npm `latest` resolves to `1.0.0`.
- README badges and install commands point at the stable package.
- Main branch is clean after the release commit and tag.

## Release Blockers

These should block V1:

- Published CLI cannot run through npm, npx, or bunx.
- Existing option categories still feel like placeholders without an explicit V1 decision.
- Default generated app cannot install and run its documented commands.
- `add` corrupts or loses existing `ces.json` state.
- Documented stack options generate missing imports, missing dependencies, invalid config, or invalid manifests.
- Package tarball omits required templates, docs, or built entry files.
- CI or release workflow requires undocumented manual edits.

## Post-V1 Backlog

These are valuable but should not block V1 unless already nearly complete:

- Additional frontend runtimes.
- Additional databases beyond SQLite.
- More native Electrobun utilities.
- End-to-end desktop launch tests.
- Hosted documentation site.
