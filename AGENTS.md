# Repository Guidelines

## Project Structure & Module Organization
- `app/`: main Next.js App Router code (UI, API routes, stores, utilities, localization, styles).
- `test/`: Jest test files (`*.test.ts`) for providers and model logic.
- `public/`: static assets and generated data (`prompts.json`, icons, service worker files).
- `src-tauri/`: Tauri desktop wrapper (Rust source, `Cargo.toml`, `tauri.conf.json`).
- `scripts/`: helper scripts for setup, proxy, and prompt fetching.
- `docs/` and `structure/`: user docs and architecture/developer notes.

## Build, Test, and Development Commands
- `pnpm install`: install JS dependencies (pnpm).
- `pnpm dev`: run web app locally with mask auto-build.
- `pnpm build && pnpm start`: production web build and server startup.
- `pnpm lint`: run Next.js ESLint checks.
- `pnpm test`: run Jest in watch mode.
- `pnpm test:ci`: run Jest once for CI.
- `pnpm app:dev`: run Tauri desktop app in development.
- `pnpm app:build`: package desktop app.

## Coding Style & Naming Conventions
- TypeScript-first; keep `strict`-compatible types (see `tsconfig.json`).
- Prettier enforced: 2 spaces, semicolons, double quotes, trailing commas.
- ESLint extends `next/core-web-vitals`; unused imports are warned.
- Prefer descriptive file names by domain (for example `app/client/platforms/openai.ts`).
- Keep tests and features near their module domain; use path alias `@/*` for imports.

## Testing Guidelines
- Framework: Jest + `jsdom` + Testing Library setup in `jest.setup.ts`.
- Naming: `*.test.ts` / `*.test.tsx`.
- Location: existing suite is under `test/`; add tests there unless a feature-specific location is justified.
- Coverage provider is `v8`; include happy-path and failure-path assertions for provider/model changes.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat:`, `fix:`, `docs:`, `chore:`.
- Keep commits focused and scoped to one logical change.
- Use SSH for GitHub pushes in this repo: HTTPS auth is not configured in the current environment, so push with `git push git@github.com:qinwencheng/NextChat.git <branch>:<branch>` or set an SSH `pushurl` first.
- PRs should include a clear summary and rationale, linked issue (if applicable), screenshots/GIFs for UI changes, and test/lint evidence (`pnpm lint`, `pnpm test:ci`).

## Security & Configuration Tips
- Use `.env.template` as the source of required variables; keep local secrets in `.env.local`.
- Minimum environment from README: Node.js >= 18 (Docker >= 20 for containerized workflows).
- Do not commit API keys, tokens, or generated local secrets.
