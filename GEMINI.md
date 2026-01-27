# Gemini Code Guide: NextChat

This document provides a comprehensive overview of the NextChat project, its architecture, and development practices to be used as instructional context for future interactions.

## 1. Project Overview

NextChat is a cross-platform AI assistant application built with Next.js and React. It serves as a user-friendly client for various Large Language Models (LLMs) including those from OpenAI, Google, Anthropic, and more.

Key architectural features include:

*   **Frontend:** A responsive web application built with **Next.js** and **React**. The UI is located in `app/components`.
*   **Desktop App:** The web frontend is wrapped in a **Tauri** application, enabling cross-platform support for Windows, macOS, and Linux. The Tauri-specific Rust code is in `src-tauri`.
*   **API Architecture:** A backend-for-frontend (BFF) is implemented using Next.js API Routes (`app/api`). These routes act as proxies, securely forwarding requests from the client to the respective third-party LLM APIs. This abstracts API access and hides sensitive keys from the client.
*   **State Management:** Global application state is managed by **Zustand**. Stores are defined in `app/store` and use a custom persistence layer (`app/utils/store.ts`) that saves data to IndexedDB, ensuring user data remains on their local device.
*   **Styling:** The project uses **Sass (SCSS)** with CSS Modules for component-level styling. Global styles are defined in `app/styles`.

## 2. Building and Running

The project uses `yarn` as its package manager. Key commands are defined in `package.json`.

### **Installation**

First, install the necessary dependencies:

```bash
yarn install
```

### **Web Application**

*   **Run in development mode:** This command starts the Next.js development server.
    ```bash
    yarn dev
    ```

*   **Create a production build:**
    ```bash
    yarn build
    ```

*   **Run the production server:**
    ```bash
    yarn start
    ```

### **Desktop Application (Tauri)**

*   **Run in development mode:** This will open the Tauri window and connect it to the Next.js development server.
    ```bash
    yarn app:dev
    ```

*   **Build the desktop application:** This command bundles the frontend and Rust backend into a distributable application.
    ```bash
    yarn app:build
    ```

### **Testing**

*   Run tests in watch mode using Jest:
    ```bash
    yarn test
    ```

## 3. Project Architecture & Ground Truth

The project documentation has been thoroughly audited and corrected to eliminate "AI hallucinations." For detailed technical analysis, always refer to the following verified documents in the `structure/` directory:

-   **`structure/architecture_fixed.md`**: High-level overview of the entire system, data flow, and deployment modes (Web vs. Desktop).
-   **`structure/app_fixed.md`**: In-depth analysis of the frontend (`app` directory), including UI component hierarchy, Markdown rendering pipeline, MCP integration, and design systems.
-   **`structure/tauri_fixed.md`**: Detailed breakdown of the Rust backend (`src-tauri`), focusing on the `stream_fetch` mechanism and native integrations.
-   **`structure/dev-guide_fixed.md`**: Practical guide for secondary development, providing entry points for common tasks like adding providers or UI pages.

**Note:** The original, non-fixed versions of these files have been removed. The `*_fixed.md` files are the authoritative source of truth for the codebase architecture.

## 4. Development Conventions

*   **Path Aliases:** The project uses the `@/*` alias to refer to the root directory (configured in `tsconfig.json`). For example, `@/app/components/home.tsx`.
*   **State Management:** When adding new global state, create or update a Zustand store in the `app/store` directory. Use the `createPersistStore` factory for data that needs to be saved across sessions.
*   **API Architecture:** The project uses a provider-specific handler pattern. All API requests are routed through `app/api/[provider]/[...path]/route.ts`, which then dispatches to specific handlers like `app/api/openai.ts`. Each handler manages its own authentication via `app/api/auth.ts`.
*   **Linting:** The project uses ESLint with the standard Next.js configuration. Run `yarn lint` to check for issues.
*   **Tauri Commands:** For new desktop-specific functionality requiring system access (e.g., filesystem), define a new command in a Rust file within `src-tauri/src/` and register it in `src-tauri/src/main.rs`. Define its TypeScript types in `app/global.d.ts` and call it from the frontend using `window.__TAURI__.invoke()`.
## 5. User Preferences & Best Practices

Based on recent feature implementations (e.g., Auto-Backup), adhere to the following principles to maintain code quality and user experience:

*   **Architecture First:** Prioritize modularity. Don't stuff logic into existing large files (like `settings.tsx` or `home.tsx`).
    *   **UI Decoupling:** Create dedicated subdirectories in `app/components/` for new features (e.g., `app/components/auto-backup/`). Extract complex logic into separate components and utility files.
    *   **Store Purity:** Keep Zustand stores focused on state management. Offload heavy business logic (file I/O, hashing, complex calculations) to dedicated helper functions or services.
*   **Global Scheduling:** For background tasks (like backups or syncs), use a dedicated Client Component integrated into `app/layout.tsx`. This ensures the task runs globally across the application, not just on specific pages.
*   **Performance Awareness:**
    *   **Smart Change Detection:** Avoid brute-force saving. Implement efficient hashing (e.g., checking content length + timestamps) to detect actual changes before triggering expensive I/O operations.
    *   **Non-Blocking I/O:** Always use asynchronous APIs for file operations and storage.
*   **UI/UX Consistency:**
    *   **Native Feel:** Respect the existing "Application Window" design language. Use standard components (`ListItem`, `IconButton`, `InputRange`) to match the visual style.
    *   **Theme Adaptability:** Ensure all new UI elements automatically adapt to both Light and Dark modes using CSS variables.
*   **Testing:** Write unit tests for core logic (stores, utils). Use mocks effectively to isolate dependencies (like `nanoid`, `idb-keyval`) and ensure tests are robust and deterministic.
