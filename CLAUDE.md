# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VSCode extension that makes folder/file paths in Markdown files clickable. Supports three URI protocols (`folder://`, `reveal://`, `edit://`) in both standard markdown link syntax and wiki-style (`[[protocol:path]]`). Activates only on Markdown files. Zero runtime dependencies — uses only Node.js builtins.

## Build & Development Commands

```bash
npm install              # Install dev dependencies
npm run compile          # Compile TypeScript to out/
npm run watch            # Compile on change (for local dev)
npm test                 # Compile + run integration tests in VS Code Extension Host
vsce package             # Build .vsix (requires globally installed vsce)
```

Press F5 in VS Code to launch an Extension Development Host for manual testing.

Tests run inside a real VS Code instance via `@vscode/test-electron` and Mocha (TDD UI, 20s timeout). The first `npm test` run downloads a VS Code build to `.vscode-test/`; subsequent runs use the cache.

## Architecture

All extension logic lives in a single file: `src/extension.ts` (~300 lines).

**Key components:**

- **`FolderLinkProvider`** (DocumentLinkProvider) — Regex-based detection of `folder://`, `reveal://`, `edit://` links in both `[text](protocol://path)` and `[[protocol:path]]` syntax. Converts matches to DocumentLinks that invoke the `markdownFolderLinks.openLink` command.
- **`FolderLinkHoverProvider`** (HoverProvider) — Shows path info on hover (directory item count, file size, or missing-path warning). Controlled by `markdownFolderLinks.enableHoverPreview` setting.
- **`openPath()`** — Executes platform-specific shell commands: `open`/`open -R` on macOS, `start`/`explorer.exe /select` on Windows, `xdg-open` on Linux. Handles missing-path prompts and file creation for `edit://`.
- **`expandPath()`** — Resolves `~`, URL-decodes, and converts relative paths using workspace root.

**Extension configuration** (in `package.json` under `contributes.configuration`):
- `markdownFolderLinks.enableHoverPreview` (boolean, default: true)
- `markdownFolderLinks.defaultAction` ("open" | "reveal", default: "open")

## Coding Conventions

- TypeScript strict mode. Target ES2020, CommonJS modules.
- 2-space indentation, LF line endings, UTF-8.
- camelCase for variables/functions, PascalCase for types/interfaces.
- Keep VS Code API imports as `import * as vscode from 'vscode'`.
- Conventional Commits for commit messages (`feat:`, `fix:`, `docs:`, etc.).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci && npm test` on push/PR across Ubuntu, macOS, and Windows. Linux uses `xvfb-run` for headless Electron tests.

## Security Notes

The extension operates on local paths only. Shell commands must be properly quoted and paths normalized — avoid introducing remote execution or new URL schemes.
