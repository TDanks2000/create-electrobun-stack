# Changelog

## 1.2.2

### Changed

- Renames the compact agent reference from `docs/llm.txt` to `docs/llms.txt` and updates documentation links.

### Removed

- Removes the completed V1 release plan document from the published docs.

## 1.2.1

### Changed

- Refreshes the README with the current generated stack surface, common recipes, generated commands, and key generated files.
- Improves the post-create final screen with clearer next steps, verification commands, generated file pointers, and add-command guidance.

## 1.2.0

### Added

- Adds `--frontend svelte` and `--frontend sveltekit` renderer modes with prompts, CLI help, manifest/schema support, generated templates, and validation coverage.
- Adds `--packaging installers` for generated AppImage, deb, DMG collection, and NSIS packaging helpers around Electrobun release artifacts.

## 1.1.0

### Added

- Adds a `--frontend preact` renderer mode for smaller direct-rendered WebViews.
- Adds `--database json-file` for lightweight local persistence through `data/app-db.json`.
- Expands `--native-utils` with `clipboard` and `desktop-kit` options backed by Electrobun clipboard utilities.
- Adds `--testing desktop-smoke`, which includes Bun tests plus a mocked Electrobun main-window launch smoke test.

### Changed

- Extends generated manifests and schema with Preact, JSON database, clipboard, and desktop smoke-test feature flags.
- Expands generated-project validation to cover Preact, JSON-file persistence, desktop-kit native utilities, and desktop smoke tests.

## 1.0.0

### Added

- Marks the V1 CLI contract as stable after the published `1.0.0-rc.5` passed npm `next` smoke tests with `npm create`, `npx`, and `bunx --bun`.
- Ships the documented Electrobun stack generator with the V1 option matrix, manifest compatibility policy, generated-project validation, package smoke tests, and trusted npm publishing workflow.

### Changed

- Promotes manifest examples and schema URLs from the prerelease package to `1.0.0`.

### Migration Notes

- `0.x` generated projects should keep their checked-in `ces.json` file. Future additive features should be applied with `create-electrobun-stack add` where possible.
- `standard` and `full` remain accepted template profile names for compatibility, but they intentionally share the V1 `minimal` template source until they have distinct, tested behavior.
- The V1 manifest contract is additive. Breaking manifest migrations require a documented migration path before release.

## 1.0.0-rc.5

### Changed

- Refreshes the V1 release candidate after aligning package repository metadata with npm trusted publishing requirements.
- Updates the generated manifest examples for the new prerelease version.

## 1.0.0-rc.4

### Changed

- Refreshes the V1 release candidate from the npm trusted publishing workflow that uses GitHub Actions OIDC instead of npm token secrets.
- Updates the generated manifest examples for the new prerelease version.

## 1.0.0-rc.3

### Changed

- Refreshes the V1 release candidate from the corrected publish workflow so prerelease publishes resolve to the npm `next` dist-tag by default.
- Keeps the generated manifest examples aligned with the next prerelease version.

## 1.0.0-rc.2

### Changed

- Refreshes the release candidate after completing the V1 public-contract, validation, publishing dry-run, and documentation phases.
- Keeps the package behavior aligned with the pre-RC documentation pass and current `main`.

## 1.0.0-rc.1

### Added

- Added a V1 release plan covering public CLI contract, generated project validation, package smoke testing, release candidates, and final `1.0.0` gates.
- Added generated-project validation scripts for the representative V1 option matrix.
- Added a packed-package smoke test that packs the npm tarball, installs it into a temp consumer project, checks `--version`, runs `--dry-run`, and scaffolds a real app without dependency installation.
- Added release workflow gates for generated-project validation and packed-package smoke testing.
- Documented manifest compatibility policy and V1 support boundaries.

### Migration Notes

- `0.x` generated projects should keep their checked-in `ces.json` file. Future additive features should be applied with `create-electrobun-stack add` where possible.
- `standard` and `full` remain accepted template profile names for compatibility, but they intentionally share the V1 `minimal` template source until they have distinct, tested behavior.
- The V1 manifest contract is additive. Breaking manifest migrations require a documented migration path before release.
