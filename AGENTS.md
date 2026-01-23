# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript sources. Main entry: `src/extension.ts` (activation, link/hover providers, command).
- `src/test/`: VS Code integration tests (Mocha + `@vscode/test-electron`). Entry: `src/test/runTest.ts`.
- `out/`: Compiled JavaScript (tsc output). Do not edit.
- `README.md`: Usage and packaging notes. `.vscodeignore` controls packaged files.
- `package.json`: VS Code contribution points and scripts.

## Build, Test, and Development Commands
- `npm install`: Install dev dependencies.
- `npm run compile`: Compile TypeScript to `out/` once.
- `npm run watch`: Compile on change for local iteration.
- `npm test`: Compile then run integration tests in a VS Code instance.
- Run in VS Code: Press F5 to launch an Extension Development Host.
- Package (optional): `vsce package` to build a `.vsix` (install `vsce` globally first).

## Coding Style & Naming Conventions
- TypeScript, strict mode (see `tsconfig.json`). Prefer named exports.
- Indentation: 2 spaces; line endings: LF; UTF‑8.
- Naming: camelCase for variables/functions, PascalCase for types/interfaces, kebab/lowercase for filenames (e.g., `extension.ts`).
- Imports: Node-style paths; keep VS Code API imports as `vscode`.
- Comments: TSDoc-style for public functions where clarity helps.

## Testing Guidelines
- Automated: Tests live in `src/test/` and run with `npm test`.
  - Covers activation on Markdown, document link provider wiring, and hover behavior for wiki-style links.
  - First run downloads a VS Code build; subsequent runs are faster.
- Manual: With F5, verify link behaviors in a Markdown file:
  - `[Open](folder://~/Documents)` opens folder
  - `[Reveal](reveal://./README.md)` reveals item
  - `[Edit](edit://./notes/todo.md)` opens/creates in VS Code
  - `[View](view://./README.md)` opens in preview mode (text) or system viewer (binary)
- Cross-platform: Sanity check macOS/Windows/Linux behavior where possible.

## Continuous Integration
- Workflow: `.github/workflows/ci.yml` runs `npm ci` and `npm test` on push/PR across Ubuntu, macOS, and Windows.
- Linux: Uses `xvfb-run` to run Electron tests headlessly.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat:`, `fix:`, `docs:`). Example from history: `docs: document edit link protocol`.
- PRs: Include concise description, linked issues, and before/after notes or screenshots when UX changes.
- Requirements: Tests pass (`npm test`), update README/CHANGELOG for user-facing changes, and adjust examples as needed.

## Security & Configuration Tips
- Scope: Operates on local paths only. We quote shell commands and normalize paths; avoid introducing remote execution or URL schemes.
- Settings: See `markdownFolderLinks.*` in `package.json` for configurable defaults (hover preview, default action).
