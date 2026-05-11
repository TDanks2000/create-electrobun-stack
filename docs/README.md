# Documentation

This folder is the durable reference for `create-electrobun-stack`. It is meant to work for humans scanning the project and for LLMs that need accurate, low-ambiguity context.

## Start Here

- [CLI reference](./reference/cli.md) covers commands, flags, defaults, and examples.
- [Stack options](./reference/options.md) explains each scaffold option, what files it affects, and the combinations that are valid.
- [Manifest reference](./reference/manifest.md) documents `ces.json` and links to the JSON schema.
- [Generated project guide](./guides/generated-project.md) explains the app that gets created and how to work in it after scaffolding.
- [Add command](./guides/add-command.md) explains how existing generated apps are expanded through `ces.json`.
- [Templates](./internals/templates.md) explains the template overlay structure used by the generator.
- [V1 release plan](./roadmap/v1-plan.md) tracks the work needed to move from pre-release to `1.0.0`.
- [LLM guide](./llm.txt) is a compact plain-text summary for agents and retrieval systems.

## Folder Map

- `reference/` holds stable CLI, option, and manifest contracts.
- `guides/` holds task-oriented docs for working with generated projects.
- `internals/` holds contributor-facing implementation docs.
- `roadmap/` holds planning docs and release gates.
- `ces.schema.json` stays at the docs root because generated manifests point at that public path.
- `llm.txt` stays at the docs root as the compact retrieval entrypoint.

## Recommended Reading Path

For a first app:

1. Read the root [README](../README.md).
2. Use [CLI reference](./reference/cli.md) for commands.
3. Use [Stack options](./reference/options.md) before choosing optional integrations.
4. Use [Generated project guide](./guides/generated-project.md) once the app exists.

For contributing to the generator:

1. Read [Templates](./internals/templates.md) to understand `base` and option overlays.
2. Read [Manifest reference](./reference/manifest.md) before changing `ces.json`.
3. Update [LLM guide](./llm.txt) when user-facing options or behavior changes.

## Documentation Rules

- Place new docs in the folder that matches the reader: `reference/`, `guides/`, `internals/`, or `roadmap/`.
- Add a new top-level docs file only for stable public paths or machine-readable entrypoints.
- Prefer exact flag names, generated paths, and commands over broad descriptions.
- Document what exists now. Mark future ideas as future work only when they are relevant to current behavior.
- When adding a scaffold option, update `reference/cli.md`, `reference/options.md`, `guides/generated-project.md` if generated files change, `reference/manifest.md` if manifest fields change, `internals/templates.md` if template layout changes, and `llm.txt`.
