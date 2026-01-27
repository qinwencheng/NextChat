# NextChat 二次开发热点功能指导文档 (Fixed Version)

## 前言

### 文档定位

本文档是一份"授人以渔"的开发指导手册，旨在帮助开发者快速定位 NextChat 项目中各类功能的开发入口点。本文档基于项目实际代码结构进行了修正，确保所有引用的文件路径和逻辑真实存在。

- **从哪里开始**：定位关键文件和代码位置
- **遵循什么模式**：了解项目约定和最佳实践
- **复用什么组件**：避免重复造轮子

### 目标读者

- 具备 React/Next.js 基础的前端开发者
- 希望在 NextChat 上开发新功能的二次开发者
- 对 Tauri 桌面开发有兴趣的全栈开发者

### 如何使用本文档

1. **明确需求**：确定你要开发的功能类型
2. **阅读对应章节**：了解关键文件、开发模式和约定
3. **参考示例**：根据章节中的示例参考进行开发

### 技术领域划分

| 领域 | 核心能力 |
|------|----------|
| 前端路由与界面扩展域 | 新增页面、侧边栏 TAB、多窗口、URL 参数判断 |
| 消息流与中间件拦截域 | 消息发送前拦截、System Prompt 注入、内容预处理 |
| 状态管理与数据持久化域 | 新建 Zustand Store、IndexedDB 持久化、版本迁移 |
| Tauri 系统集成域 | 自定义 Rust 命令、系统事件、多窗口、快捷键 |
| 外部 API 与网络请求域 | 新增 API Route、代理模式、流式/非流式请求 |
| 工具函数与类型系统域 | 工具函数复用、类型定义扩展 |
| 子进程与外部程序通信域 | Rust Sidecar、Stdio 通信 (高级功能) |

---

## 第一章：前端路由与界面扩展域

### 1.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **新增独立页面（TAB）**：如 Prompt 市场、文档收藏等
- **扩展侧边栏入口**：在侧边栏添加新的功能入口
- **URL 参数驱动的界面差异**：根据 URL 参数渲染不同内容

### 1.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/constant.ts` | Path 枚举定义 | `enum Path` 定义处 |
| `app/components/home.tsx` | Route 配置与动态导入 | `Routes` 组件及 `dynamic` 导入部分 |
| `app/components/sidebar.tsx` | 侧边栏 DISCOVERY 数组 | `const DISCOVERY` 数组定义 |
| `src-tauri/tauri.conf.json` | Tauri 窗口配置 | `windows` 配置项 |

### 1.3 开发模式

#### 模式一：新增独立页面（TAB）

1. **定义路由路径**：在 `app/constant.ts` 的 `Path` 枚举中添加新路径

```typescript
// app/constant.ts
export enum Path {
  Home = "/",
  Chat = "/chat",
  // ... 其他现有路径
  YourNewFeature = "/your-new-feature", // 添加你的新路径
}
```

2. **创建页面组件**：在 `app/components/` 下创建新组件文件

```typescript
// app/components/your-feature.tsx
export function YourFeaturePage() {
  return <div>Your Feature Content</div>;
}
```

3. **注册动态导入**：在 `app/components/home.tsx` 中添加动态导入

```typescript
// app/components/home.tsx
const YourFeaturePage = dynamic(
  async () => (await import("./your-feature")).YourFeaturePage,
  {
    loading: () => <Loading noLogo />,
  },
);
```

4. **添加路由配置**：在 `home.tsx` 的 `Routes` 组件中添加路由

```typescript
// app/components/home.tsx
<Routes>
  <Route path={Path.Home} element={<Chat />} />
  {/* ... 其他路由 ... */}
  <Route path={Path.YourNewFeature} element={<YourFeaturePage />} />
</Routes>
```

#### 模式二：扩展侧边栏入口

在 `app/components/sidebar.tsx` 的 `DISCOVERY` 数组中添加入口：

```typescript
// app/components/sidebar.tsx
const DISCOVERY = [
  { name: Locale.Plugin.Name, path: Path.Plugins },
  { name: "Stable Diffusion", path: Path.Sd },
  { name: Locale.SearchChat.Page.Title, path: Path.SearchChat },
  // 添加你的入口
  { name: "Your Feature", path: Path.YourNewFeature },
];
```

---

## 第二章：消息流与中间件拦截域

### 2.1 场景描述

- **消息发送前拦截**：在消息发送前修改内容或附加信息
- **System Prompt 注入**：动态修改系统提示词
- **MCP 响应处理**：处理来自模型上下文协议的响应

### 2.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/store/chat.ts` | 消息处理核心逻辑 | `onUserInput()`, `getMessagesWithMemory()` |
| `app/store/chat.ts` | 模板填充 | `fillTemplateWith()` |
| `app/utils.ts` | 消息工具函数 | `isVisionModel()`, `getMessageTextContent()` |

### 2.3 开发模式

#### 模式一：消息发送前拦截

**核心入口**：`app/store/chat.ts` 的 `onUserInput()` 方法

```typescript
// app/store/chat.ts
async onUserInput(
  content: string,
  attachImages?: string[],
  isMcpResponse?: boolean,
) {
  // ...
  // 在这里可以拦截 content 或 attachImages
  // ...

  let mContent: string | MultimodalContent[] = isMcpResponse
    ? content
    : fillTemplateWith(content, modelConfig);
  
  // ... 后续逻辑
}
```

#### 模式二：System Prompt 动态注入

**核心入口**：`app/store/chat.ts` 的 `getMessagesWithMemory()` 方法

```typescript
// app/store/chat.ts
async getMessagesWithMemory() {
  // ...
  const mcpEnabled = await isMcpEnabled();
  const mcpSystemPrompt = mcpEnabled ? await getMcpSystemPrompt() : "";

  var systemPrompts: ChatMessage[] = [];

  // 逻辑：构建 systemPrompts 数组
  if (shouldInjectSystemPrompts) {
      // 注入默认模板 + MCP 提示词
  }
  
  // ...
}
```

---

## 第三章：状态管理与数据持久化域

### 3.1 场景描述

- **新建 Store**：管理新功能的全局状态
- **数据持久化**：自动保存状态到本地存储 (IndexedDB/LocalStorage)

### 3.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/utils/store.ts` | Store 工厂函数 | `createPersistStore()` |
| `app/constant.ts` | Store Key 枚举 | `StoreKey` |
| `app/store/*.ts` | 各个 Store 实现 | 参考 `app/store/chat.ts` 或 `app/store/config.ts` |

### 3.3 开发模式

#### 模式一：新建 Zustand Store

1. **定义 StoreKey**：在 `app/constant.ts` 中添加唯一键名
2. **创建 Store**：使用 `createPersistStore`

```typescript
// app/store/your-feature.ts
import { createPersistStore } from "../utils/store";
import { StoreKey } from "../constant";

const DEFAULT_STATE = { /* ... */ };

export const useYourFeatureStore = createPersistStore(
  DEFAULT_STATE,
  (set, get) => ({
    // action methods
    updateItem(newItem) {
       set((state) => ({ ...state, item: newItem }));
    }
  }),
  {
    name: StoreKey.YourFeature, // 必须在 StoreKey 中定义
    version: 1,
  }
);
```

---

## 第四章：Tauri 系统集成域

### 4.1 场景描述

- **调用 Rust 命令**：执行本地系统操作
- **流式数据传输**：Tauri 端流式返回数据给前端

### 4.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `src-tauri/src/main.rs` | Tauri 入口，命令注册 | `main` 函数 |
| `src-tauri/src/stream.rs` | 流式命令实现 | `stream_fetch` |
| `app/utils.ts` | 前端调用封装 | `fetch` 函数 (适配 Tauri) |

### 4.3 开发模式

#### 模式一：调用现有流式 Fetch

项目已经封装了 `stream_fetch` 命令用于绕过浏览器 CORS 限制。

**Rust 端** (`src-tauri/src/stream.rs`):
实现了 `stream_fetch` 命令，支持流式响应。

**前端** (`app/utils.ts`):
导出了 `fetch` 函数，自动判断环境：

```typescript
export function fetch(url: string, options?: Record<string, unknown>) {
  if (window.__TAURI__) {
    return tauriStreamFetch(url, options); // 调用 src-tauri/stream.rs
  }
  return window.fetch(url, options);
}
```

#### 模式二：新增 Rust 命令 (需新建文件)

如果你需要添加新的 Rust 命令，例如 `your_command`:

1.  在 `src-tauri/src/` 下创建新文件（例如 `your_mod.rs`）。
2.  在 `src-tauri/src/main.rs` 中引入并注册：
    ```rust
    mod your_mod;
    // ...
    .invoke_handler(tauri::generate_handler![
        stream::stream_fetch,
        your_mod::your_command, // 注册新命令
    ])
    ```

---

## 第五章：外部 API 与网络请求域

### 5.1 场景描述

- **接入新 AI 模型**：添加新的 LLM 提供商
- **API 代理**：配置 Next.js API 路由转发请求

### 5.2 关键文件映射

| 文件路径 | 职责 |
|----------|------|
| `app/client/platforms/*.ts` | 各厂商 API 客户端实现 (如 `openai.ts`, `google.ts`) |
| `app/client/api.ts` | ClientApi 统一入口 |
| `app/api/[provider]/[...path]/route.ts` | Next.js API 路由 (处理 `/api/openai/*` 等) |

### 5.3 开发模式

#### 模式一：新增 LLM Provider

1.  **定义常量**：在 `app/constant.ts` 添加 `ModelProvider` 和 `ApiPath`。
2.  **实现 Client**：在 `app/client/platforms/` 下参考 `openai.ts` 实现新的 API 类。
3.  **注册 Client**：在 `app/client/api.ts` 的 `ClientApi` 类中实例化你的 Client。
4.  **配置代理 (可选)**：如果需要后端代理，修改 `app/api/[provider]/[...path]/route.ts` 以处理新的 Provider 路径。

---

## 第六章：工具函数与类型系统域

### 6.1 关键文件映射

| 文件路径 | 职责 | 常用函数/类型 |
|----------|------|---------------|
| `app/utils.ts` | 核心工具函数 | `isVisionModel`, `isDalle3`, `fetch`, `copyToClipboard` |
| `app/utils/format.ts` | 格式化工具 | `prettyObject` |
| `app/store/chat.ts` | (Store内) | 包含聊天相关逻辑，但通用工具多在 `app/utils.ts` |
| `app/typing.ts` | 类型定义 | 通用类型定义 |

**注意**：原文档提到的 `app/utils/checkers.ts` 实际上不存在，相关模型检测函数（如 `isVisionModel`）位于 `app/utils.ts` 中。

---

## 第七章：子进程与外部程序通信域 (高级)

### 7.1 说明

此部分功能在当前代码库中**没有预置的业务代码**（如 `src-tauri/src/sidecar.rs` 或 `git.rs` 实际上不存在）。如果需要使用 Sidecar 或执行系统命令，需要开发者自行创建文件并配置 Tauri。

### 7.2 开发指南

若需实现 Sidecar 功能：

1.  **添加文件**：在 `src-tauri/src/` 下新建 Rust 模块（例如 `sidecar.rs`）。
2.  **配置 Tauri**：在 `src-tauri/tauri.conf.json` 中配置 `shell` 权限和 `externalBin`。
3.  **编写逻辑**：使用 `tauri::api::process::Command` API。
4.  **前端调用**：使用 `window.__TAURI__.invoke` 或事件监听。


---

## 第八章：二次开发实战经验与最佳实践

本章汇总了在实际二次开发过程中积累的架构经验与避坑指南。建议开发者在动手写代码前阅读，以确保新增功能与原有架构的和谐共存。

### 8.1 通用架构原则

#### 1. 组件解耦与目录结构
*   **原则**：随着功能增加，单一文件（如 `settings.tsx`）极易膨胀。务必采用**模块化**思维。
*   **实践**：
    *   不要直接在主页面文件中编写复杂的子组件或模态框。
    *   应在 `app/components/` 下为新功能创建独立目录（如 `app/components/your-feature/`）。
    *   将相关的 UI 组件、工具函数、Hook 均收敛于该目录中。

#### 2. Store 职责分离
*   **原则**：Zustand Store 应专注于**状态管理**（State Management），而非**业务逻辑**（Business Logic）。
*   **实践**：
    *   Store 只负责存储数据和简单的 setter。
    *   复杂的 I/O 操作、数据计算、算法逻辑应提取为独立的工具函数（位于 `app/utils/` 或功能目录下的 `utils.ts`）。
    *   这样不仅使 Store 轻量化，也便于对核心逻辑进行单元测试。

#### 3. 全局任务调度
*   **原则**：不要依赖页面组件（如 `Home`）的生命周期来执行全局后台任务，因为用户可能停留在其他路由。
*   **实践**：
    *   创建独立的 Client Component（如 `TaskScheduler`）。
    *   将其集成到 `app/layout.tsx` (RootLayout) 中。
    *   这能确保只要应用在前台运行，后台任务（如定时同步、状态检查）就能持续工作。

### 8.2 实战案例分析：自动备份功能

在开发“自动备份”功能时，我们遇到了典型的问题并探索出了上述原则：

*   **问题一：`settings.tsx` 爆炸**
    *   *现象*：将备份管理的 UI 全部写在设置页中，导致文件难以维护。
    *   *解决*：拆分为 `auto-backup-settings.tsx` 和 `backup-manager.tsx`，主设置页仅引用组件。

*   **问题二：性能瓶颈**
    *   *现象*：频繁的全量备份导致 I/O 压力。
    *   *解决*：引入 **增量检测 (Hash)**。不依赖时间间隔，而是结合内容长度、修改时间等元数据计算指纹，仅在数据真正变更时写入。

*   **问题三：调度失效**
    *   *现象*：定时器写在 `Home` 组件中，用户进入设置页后备份停止。
    *   *解决*：将调度器上浮至 `RootLayout`，实现全站生命周期覆盖。

### 8.3 最佳实践自查清单

在提交代码前，请对照以下清单自查：

- [ ] **目录结构**：是否污染了核心文件？是否为新功能创建了独立目录？
- [ ] **代码复用**：是否重复造轮子？（例如：复用 `downloadAs` 而不是自己写文件下载）
- [ ] **国际化**：UI 文本是否已提取到 `app/locales/`？
- [ ] **深色模式**：新组件是否使用了 CSS 变量（如 `var(--white)`）以适配深色模式？
- [ ] **Web/App 兼容**：涉及文件系统或网络请求时，是否分别处理了 Web 和 Tauri 环境？
- [ ] **无障碍性**：按钮是否添加了 `aria-label` 或 `title`？
- [ ] **测试**：核心逻辑是否有单元测试覆盖？
