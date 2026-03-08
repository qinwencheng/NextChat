# Repository Guidelines

## Project Structure & Module Organization
- `app/`: main Next.js App Router code (UI, API routes, stores, utilities, localization, styles).
- `test/`: Jest test files (`*.test.ts`) for providers and model logic.
- `public/`: static assets and generated data (`prompts.json`, icons, service worker files).
- `src-tauri/`: Tauri desktop wrapper (Rust source, `Cargo.toml`, `tauri.conf.json`).
- `scripts/`: helper scripts for setup, proxy, and prompt fetching.
- `docs/` and `structure/`: user docs and architecture/developer notes.

## Build, Test, and Development Commands
- `yarn install`: install JS dependencies (Yarn 1.x).
- `yarn dev`: run web app locally with mask auto-build.
- `yarn build && yarn start`: production web build and server startup.
- `yarn lint`: run Next.js ESLint checks.
- `yarn test`: run Jest in watch mode.
- `yarn test:ci`: run Jest once for CI.
- `yarn app:dev`: run Tauri desktop app in development.
- `yarn app:build`: package desktop app.

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
- PRs should include:
  - clear summary and rationale,
  - linked issue (if applicable),
  - screenshots/GIFs for UI changes,
  - test/lint evidence (`yarn lint`, `yarn test:ci`).

## Security & Configuration Tips
- Use `.env.template` as the source of required variables; keep local secrets in `.env.local`.
- Minimum environment from README: Node.js >= 18 (Docker >= 20 for containerized workflows).
- Do not commit API keys, tokens, or generated local secrets.
