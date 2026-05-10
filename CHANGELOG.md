# Changelog

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
