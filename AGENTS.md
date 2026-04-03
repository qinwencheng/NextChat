# Repository Guidelines

## Project Structure & Module Organization
- `app/`: main Next.js App Router code, including subdirectories:
  - `api/`: API routes
  - `client/`: client-side platform integrations (e.g., `client/platforms/openai.ts`)
  - `components/`: React UI components
  - `config/`: configuration modules
  - `icons/`: icon assets
  - `lib/`: shared library code
  - `locales/`: localization files
  - `masks/`: mask definitions and build scripts
  - `mcp/`: Model Context Protocol integrations
  - `store/`: Zustand state stores
  - `styles/`: SCSS stylesheets
  - `utils/`: utility functions
  - Root files: `layout.tsx`, `page.tsx`, `command.ts`, `constant.ts`, `typing.ts`, `utils.ts`, `global.d.ts`, `polyfill.ts`
- `test/`: Jest test files for model logic and module tests.
- `public/`: static assets and generated data (`prompts.json`, icons, service worker files).
- `src-tauri/`: Tauri desktop wrapper (Rust source, `Cargo.toml`, `tauri.conf.json`).
- `scripts/`: helper scripts — `setup.sh`, `init-proxy.sh`, `delete-deployment-preview.sh`, `fetch-prompts.mjs`, and proxy template configs.
- `docs/` and `structure/`: user docs and architecture/developer notes.

## Build, Test, and Development Commands
- `pnpm install`: install JS dependencies (pnpm 9.0.0, as specified in `packageManager`).
- `pnpm dev`: run web app locally with mask auto-build.
- `pnpm build && pnpm start`: production web build and server startup.
- `pnpm lint`: run Next.js ESLint checks.
- `pnpm test`: run Jest in watch mode.
- `pnpm test:ci`: run Jest once for CI.
- `pnpm app:dev`: run Tauri desktop app in development.
- `pnpm app:build`: package desktop app.

## Coding Style & Naming Conventions
- TypeScript-first; keep `strict`-compatible types (see `tsconfig.json`).
- Prettier enforced: 2 spaces, semicolons, double quotes, trailing commas, `printWidth: 80`, `arrowParens: always`.
- ESLint extends `next/core-web-vitals`, plus `prettier` and `unused-imports` plugins; unused imports are warned at `warn` level.
- Prefer descriptive file names by domain (for example `app/client/platforms/openai.ts`).
- Keep tests and features near their module domain; use path alias `@/*` for imports (configured in both `tsconfig.json` and Jest `moduleNameMapper`).

## Testing Guidelines
- Framework: Jest + `jsdom`, configured via `nextJest` wrapper (`next/jest.js`) which auto-loads Next.js config and environment variables. Testing Library is set up in `jest.setup.ts`.
- Naming: `*.test.ts` / `*.test.tsx` (also supports `*.test.js` / `*.test.jsx` per `testMatch`).
- Location: existing suite is under `test/`; add tests there unless a feature-specific location is justified.
- Coverage provider is `v8`; include happy-path and failure-path assertions for provider/model changes.
- Path alias `@/*` is mapped in Jest via `moduleNameMapper`.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat:`, `fix:`, `docs:`, `chore:`.
- Keep commits focused and scoped to one logical change.
- Use SSH for GitHub pushes in this repo: HTTPS auth is not configured in the current environment, so push with `git push git@github.com:qinwencheng/NextChat.git <branch>:<branch>` or set an SSH `pushurl` first.
- PRs should include a clear summary and rationale, linked issue (if applicable), screenshots/GIFs for UI changes, and test/lint evidence (`pnpm lint`, `pnpm test:ci`).

## Security & Configuration Tips
- Use `.env.template` as the source of required variables; keep local secrets in `.env.local`.
- Minimum environment from README: Node.js >= 18 (Docker >= 20 for containerized workflows).
- Do not commit API keys, tokens, or generated local secrets.
