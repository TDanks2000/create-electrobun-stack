# Documentation

This folder is the durable reference for `create-electrobun-stack`. It is meant to work for humans scanning the project and for LLMs that need accurate, low-ambiguity context.

## Start Here

- [CLI reference](./cli.md) covers commands, flags, defaults, and examples.
- [Stack options](./options.md) explains each scaffold option, what files it affects, and the combinations that are valid.
- [Generated project guide](./generated-project.md) explains the app that gets created and how to work in it after scaffolding.
- [Add command](./add-command.md) explains how existing generated apps are expanded through `ces.json`.
- [Manifest reference](./manifest.md) documents `ces.json` and links to the JSON schema.
- [Templates](./templates.md) explains the template overlay structure used by the generator.
- [V1 release plan](./v1-plan.md) tracks the work needed to move from pre-release to `1.0.0`.
- [LLM guide](./llm.txt) is a compact plain-text summary for agents and retrieval systems.

## Recommended Reading Path

For a first app:

1. Read the root [README](../README.md).
2. Use [CLI reference](./cli.md) for commands.
3. Use [Stack options](./options.md) before choosing optional integrations.
4. Use [Generated project guide](./generated-project.md) once the app exists.

For contributing to the generator:

1. Read [Templates](./templates.md) to understand `base` and option overlays.
2. Read [Manifest reference](./manifest.md) before changing `ces.json`.
3. Update [LLM guide](./llm.txt) when user-facing options or behavior changes.

## Documentation Rules

- Keep this folder flat unless a topic becomes large enough to justify a subfolder.
- Prefer exact flag names, generated paths, and commands over broad descriptions.
- Document what exists now. Mark future ideas as future work only when they are relevant to current behavior.
- When adding a scaffold option, update `cli.md`, `options.md`, `generated-project.md` if generated files change, `manifest.md` if manifest fields change, `templates.md` if template layout changes, and `llm.txt`.
