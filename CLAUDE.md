# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextChat is a multi-platform ChatGPT/LLM client supporting 16+ AI providers (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Azure, and others). Built with Next.js 14 and Tauri, it deploys as a web app, PWA, or native desktop application (Windows/macOS/Linux).

## Common Commands

### Development
```bash
yarn install                # Install dependencies
yarn dev                    # Web development with hot reload
yarn app:dev               # Desktop app development (Tauri)
yarn export:dev            # Static export dev mode
```

### Building
```bash
yarn build                 # Production web build (standalone)
yarn export               # Static export build (for Tauri/static hosting)
yarn app:build            # Desktop app production build
yarn mask                 # Generate mask/prompt template bundles
```

### Testing
```bash
yarn test                 # Run Jest tests in watch mode
yarn test:ci             # Run tests in CI mode (no watch)
```

### Linting
```bash
yarn lint                # Run ESLint
```

### Other
```bash
yarn prompts             # Fetch latest prompt templates
yarn proxy-dev           # Dev with proxychains (for restricted networks)
```

## Architecture

### Overall Structure

NextChat uses a **layered architecture**:

1. **Frontend (React + Next.js)** - UI components, state management, routing
2. **Next.js API Routes** (`/app/api/*`) - Backend proxy layer for web deployment
3. **Tauri Backend** (`/src-tauri/`) - Rust-based desktop app runtime with streaming support
4. **External LLM APIs** - 16+ provider integrations

### State Management

Uses **Zustand** exclusively with IndexedDB persistence via `idb-keyval`:

- **`useChatStore`** (`app/store/chat.ts`) - Messages, sessions, conversation state
- **`useAccessStore`** (`app/store/access.ts`) - API keys and authentication
- **`useAppConfig`** (`app/store/config.ts`) - Global settings (models, theme, language)
- **`useMaskStore`** (`app/store/mask.ts`) - Conversation templates/personas
- **`usePluginStore`** (`app/store/plugin.ts`) - Plugin management

All stores use immutable update patterns via Zustand's `set()` and `get()` methods.

### Provider Integration Pattern

Each LLM provider follows this structure:

1. **Client handler**: `/app/client/platforms/{provider}.ts` - Implements `LLMApi` interface
2. **Server route**: `/app/api/{provider}.ts` - Next.js API route for web proxy
3. **Model definitions**: `/app/constant.ts` - Provider models and capabilities

**Supported providers**: OpenAI, Azure, Google Gemini, Anthropic Claude, Baidu, ByteDance, Alibaba, Tencent, Moonshot, Iflytek, DeepSeek, xAI, ChatGLM, SiliconFlow, 302.AI, Stability AI

### Message Flow (UI → API → Response)

1. **Input** (`app/components/chat.tsx`):
   - User submits message via `doSubmit()`
   - Validates input, handles commands, processes attachments

2. **Store Update** (`app/store/chat.ts`):
   - `onUserInput()` creates user and bot message objects
   - `getMessagesWithMemory()` assembles context (system prompt + memory + recent messages)

3. **API Call** (`app/client/platforms/*.ts`):
   - Formats provider-specific request payload
   - Handles multimodal content (images, vision models)
   - Special cases: O1/O3 models (no streaming), DALL-E (image generation)

4. **Streaming**:
   - **Web**: Fetch API with SSE parsing
   - **Desktop**: Tauri `stream_fetch` command → `TransformStream` → event listeners
   - Real-time updates via `onUpdate()` callback

5. **Completion**:
   - `onFinish()` finalizes message, triggers post-processing
   - `ChatControllerPool` manages request cancellation

### Dual Deployment Architecture

**Web Mode**:
- Next.js API routes (`/app/api/*`) proxy requests to LLM providers
- Environment variables store API keys server-side
- Optional access code authentication via `CODE` env var

**Desktop Mode (Tauri)**:
- Direct API calls from client (no proxy)
- Enhanced streaming via Rust backend (`/src-tauri/src/stream.rs`)
- Better performance and offline capability

### Memory Management

- **Short-term memory**: Last N messages (configurable, default 4)
- **Long-term memory**: Auto-summarized context stored in `session.memoryPrompt`
- **Auto-compression**: Triggered when message count exceeds threshold
- **Token counting**: Provider-specific tokenizers in `app/utils/token.ts`

### Build System

**Next.js Configuration** (`next.config.mjs`):
- **Build modes**:
  - `standalone`: Production server (set via `BUILD_MODE=standalone`)
  - `export`: Static export for Tauri or static hosting (set via `BUILD_MODE=export`)
- **API Rewrites**: Proxy routes configured for each provider
- **CORS Headers**: Enabled for proxy mode
- **Webpack**: SVGR loader for SVG → React components

**Tauri Pipeline**:
- `yarn export` builds Next.js static export
- `yarn tauri build` packages into native app
- Rust backend handles streaming, native dialogs, window management

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `/app` | Next.js app directory (all source code) |
| `/app/client/platforms` | LLM provider implementations (`LLMApi` interface) |
| `/app/api` | Next.js API routes (backend proxy/auth layer) |
| `/app/store` | Zustand state management stores |
| `/app/components` | React UI components |
| `/app/config` | Server and client configuration |
| `/app/utils` | Utilities (streaming, tokens, chat, format, etc.) |
| `/app/mcp` | Model Context Protocol (MCP) integration |
| `/app/masks` | Conversation template system (prompt templates) |
| `/app/locales` | i18n translation files (15+ languages) |
| `/src-tauri` | Tauri desktop app backend (Rust) |
| `/public` | Static assets, masks.json, prompts.json |
| `/test` | Jest unit tests |
| `/scripts` | Build and setup scripts |

## Important Patterns

### Adding a New LLM Provider

1. Create client handler in `/app/client/platforms/{provider}.ts`:
   ```typescript
   export class {Provider}Api implements LLMApi {
     async chat(options: ChatOptions) { /* ... */ }
     async models() { /* ... */ }
   }
   ```

2. Create API route in `/app/api/{provider}/[...path]/route.ts`:
   ```typescript
   export async function POST(req: Request) {
     // Proxy logic with authentication
   }
   ```

3. Add provider to `ModelProvider` enum in `/app/constant.ts`

4. Add models to `MODELS` array in `/app/constant.ts`

5. Add environment variables to `.env.template`

### Mask System (Prompt Templates)

Masks are reusable conversation templates with:
- Custom system prompts
- Model overrides
- Context prompts
- Model configuration overrides

**Location**: `/app/masks/` (TypeScript source) → `/public/masks.json` (compiled)

**Build**: `yarn mask` compiles masks from `/app/masks/*.ts` to JSON

### MCP (Model Context Protocol) Support

Enable with `ENABLE_MCP=true` environment variable.

**Integration points**:
- Server registry: `/app/mcp/server.ts`
- Client registry: `/app/store/mcp.ts`
- Tool invocation: Markdown code blocks with format ` ```json:mcp:{clientId} `
- Callbacks: `onBeforeTool()` and `onAfterTool()` in chat options

### Testing

**Framework**: Jest with jsdom environment

**Test patterns**:
- Model availability checks (`test/model-available.test.ts`)
- Provider validation (`test/model-provider.test.ts`)
- Vision model detection (`test/vision-model-checker.test.ts`)

**Run single test**:
```bash
node --no-warnings --experimental-vm-modules $(yarn bin jest) path/to/test.test.ts
```

### Environment Variables

**Critical server-side variables** (set in `.env.local` or deployment platform):

- `OPENAI_API_KEY` - OpenAI authentication (required for OpenAI proxy)
- `ANTHROPIC_API_KEY` - Anthropic Claude authentication
- `GOOGLE_API_KEY` - Google Gemini authentication
- `CODE` - Access password (comma-separated for multiple)
- `BASE_URL` - Override OpenAI endpoint
- `ENABLE_MCP` - Enable Model Context Protocol
- `CUSTOM_MODELS` - Add/hide/rename models (e.g., `+llama,-gpt-3.5-turbo`)
- `DISABLE_GPT4` - Restrict GPT-4 access
- `HIDE_USER_API_KEY` - Prevent users from entering API keys

See `.env.template` for full list.

## Special Handling

### O1/O3 Models
- No streaming support (use `stream: false`)
- No system prompts (inject into first user message)
- Fixed temperature (1.0)
- Handle via `isO1` flag in model config

### Vision Models
- Detect via `isVisionModel()` in `app/utils/checkers.ts`
- Image preprocessing via `preProcessImageContent()`
- Supported formats: JPEG, PNG, WebP, GIF
- HEIC conversion via `heic2any`

### Realtime Chat (Audio)
- Uses Azure Realtime Audio SDK (`rt-client` package)
- WebSocket-based streaming
- Voice activity detection (VAD)
- Tool calling support

## Path Aliases

TypeScript path alias `@/*` maps to repository root:
```typescript
import { useChatStore } from "@/app/store/chat";
```

Configured in `tsconfig.json` and `jest.config.ts`.

## Deployment Modes

1. **Vercel/Web**: Deploy with environment variables, uses API routes as proxy
2. **Docker**: `docker pull yidadaa/chatgpt-next-web`, configure via env vars
3. **Static Export**: `yarn export` → deploy to any static host
4. **Desktop App**: `yarn app:build` → platform-specific installers
5. **Self-hosted**: `yarn build` + `yarn start` for Node.js server

## Notes

- **Package manager**: Yarn 1.22.19 (specified in `packageManager` field)
- **Node.js version**: >= 18 (check `.nvmrc`)
- **TypeScript**: Strict mode enabled
- **i18n**: Add translations in `/app/locales/{lang}.ts`
- **Icons**: SVG files in `/app/icons/` compiled to React components
- **Streaming**: Different implementations for web vs desktop (Tauri)
- **Storage**: Browser LocalStorage + IndexedDB, optional WebDAV/Upstash sync
