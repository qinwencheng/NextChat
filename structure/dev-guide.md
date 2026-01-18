# NextChat 二次开发热点功能指导文档

## 前言

### 文档定位

本文档是一份"授人以渔"的开发指导手册，旨在帮助开发者快速定位 NextChat 项目中各类功能的开发入口点。文档不会详细讲解具体实现步骤，而是指引开发者：

- **从哪里开始**：定位关键文件和代码位置
- **遵循什么模式**：了解项目约定和最佳实践
- **复用什么组件**：避免重复造轮子

### 目标读者

- 具备 React/Next.js 基础的前端开发者
- 希望在 NextChat 上开发新功能的二次开发者
- 对 Tauri 桌面开发有兴趣的全栈开发者

### 如何使用本文档

1. **明确需求**：确定你要开发的功能类型
2. **查阅附录 A**：通过"功能→领域"索引找到对应章节
3. **阅读对应章节**：了解关键文件、开发模式和约定
4. **参考示例**：根据章节中的示例参考进行开发

### 技术领域划分

本文档将二次开发所需的技术能力划分为 8 大领域：

| 领域 | 核心能力 |
|------|----------|
| 前端路由与界面扩展域 | 新增页面、侧边栏 TAB、多窗口、URL 参数判断 |
| 消息流与中间件拦截域 | 消息发送前拦截、System Prompt 注入、内容预处理 |
| 状态管理与数据持久化域 | 新建 Zustand Store、IndexedDB 持久化、版本迁移 |
| Tauri 系统集成域 | 自定义 Rust 命令、系统事件、多窗口、快捷键、子进程 |
| 外部 API 与网络请求域 | 新增 API Route、代理模式、流式/非流式请求、WebSocket |
| 工具函数与类型系统域 | 工具函数复用、类型定义扩展、JSON 协议解析 |
| 子进程与外部程序通信域 | Rust Sidecar、Stdio 通信、系统命令执行、Git 操作 |
| 实时推送与通知域 | 服务端推送、WebSocket/SSE、系统通知调用 |

---

## 第一章：前端路由与界面扩展域

### 1.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **新增独立页面（TAB）**：如 Prompt 市场、文档收藏、MCP 市场等
- **扩展侧边栏入口**：在侧边栏添加新的功能入口
- **Tauri 多窗口**：如划词翻译工具、独立设置窗口等
- **URL 参数驱动的界面差异**：根据 URL 参数渲染不同内容

### 1.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/constant.ts` | Path 枚举定义 | 第 44-57 行 |
| `app/components/home.tsx` | Route 配置与动态导入 | 第 43-83 行（动态导入）、第 196-205 行（路由配置） |
| `app/components/sidebar.tsx` | 侧边栏 DISCOVERY 数组 | 第 36-40 行 |
| `src-tauri/tauri.conf.json` | Tauri 窗口配置 | 第 108-118 行 |

### 1.3 开发模式

#### 模式一：新增独立页面（TAB）

**步骤概览**：

1. **定义路由路径**：在 `app/constant.ts` 的 `Path` 枚举中添加新路径

```typescript
// app/constant.ts:44-57
export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Plugins = "/plugins",
  Auth = "/auth",
  Sd = "/sd",
  SdNew = "/sd-new",
  Artifacts = "/artifacts",
  SearchChat = "/search-chat",
  McpMarket = "/mcp-market",
  // 添加你的新路径
  YourNewFeature = "/your-new-feature",
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
// app/components/home.tsx:196-205
<Routes>
  <Route path={Path.Home} element={<Chat />} />
  {/* ... 其他路由 ... */}
  <Route path={Path.YourNewFeature} element={<YourFeaturePage />} />
</Routes>
```

#### 模式二：扩展侧边栏入口

**步骤概览**：

在 `app/components/sidebar.tsx` 的 `DISCOVERY` 数组中添加入口：

```typescript
// app/components/sidebar.tsx:36-40
const DISCOVERY = [
  { name: Locale.Plugin.Name, path: Path.Plugins },
  { name: "Stable Diffusion", path: Path.Sd },
  { name: Locale.SearchChat.Page.Title, path: Path.SearchChat },
  // 添加你的入口
  { name: "Your Feature", path: Path.YourNewFeature },
];
```

**注意**：如需国际化，应在 `app/locales/` 下各语言文件中添加对应翻译。

#### 模式三：Tauri 多窗口

**步骤概览**：

1. **配置窗口**：在 `src-tauri/tauri.conf.json` 的 `windows` 数组中添加新窗口配置

```json
// src-tauri/tauri.conf.json:108-118
{
  "windows": [
    {
      "fullscreen": false,
      "height": 600,
      "resizable": true,
      "title": "NextChat",
      "width": 960,
      "hiddenTitle": true,
      "titleBarStyle": "Overlay"
    },
    {
      "label": "translator",
      "title": "Translator",
      "width": 400,
      "height": 300,
      "url": "/#/translator",
      "visible": false
    }
  ]
}
```

2. **前端区分渲染**：通过 URL hash 或查询参数区分主窗口和子窗口

```typescript
// 在组件中判断
const isTranslatorWindow = window.location.hash.includes("/translator");
```

3. **通过 Tauri API 打开窗口**

```typescript
// 前端调用
if (window.__TAURI__) {
  const { WebviewWindow } = await import("@tauri-apps/api/window");
  const win = new WebviewWindow("translator", {
    url: "/#/translator",
  });
}
```

#### 模式四：URL 参数驱动界面差异

**示例**：Artifacts 页面的路径参数处理

```typescript
// app/components/home.tsx:177-182
if (isArtifact) {
  return (
    <Routes>
      <Route path="/artifacts/:id" element={<Artifacts />} />
    </Routes>
  );
}
```

**获取参数**：使用 `react-router-dom` 的 `useParams` 或 `useLocation`

```typescript
import { useParams, useLocation } from "react-router-dom";

function YourComponent() {
  const { id } = useParams();           // 获取路径参数
  const location = useLocation();       // 获取完整 location
  const searchParams = new URLSearchParams(location.search);
}
```

### 1.4 约定与规范

1. **路径命名**：使用 kebab-case，如 `/search-chat`、`/mcp-market`
2. **组件命名**：页面组件使用 PascalCase + Page 后缀，如 `McpMarketPage`
3. **动态导入**：所有页面组件必须使用 `dynamic()` 进行代码分割
4. **Loading 状态**：动态导入时必须提供 `loading` 占位组件
5. **国际化**：侧边栏入口名称应使用 `Locale` 对象，支持多语言

### 1.5 示例参考

| 功能 | 参考文件 | 说明 |
|------|----------|------|
| MCP 市场 | `app/components/mcp-market.tsx` | 完整的 TAB 页面示例 |
| 插件页面 | `app/components/plugin.tsx` | 带列表和详情的页面 |
| 搜索聊天 | `app/components/search-chat.tsx` | 带搜索功能的页面 |
| Stable Diffusion | `app/components/sd.tsx` | 特殊布局的页面（不使用侧边栏） |

---

## 第二章：消息流与中间件拦截域

### 2.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **文件上传读取**：读取用户上传的文件内容并注入到消息中
- **联网搜索**：在消息发送前拦截，调用搜索 API 后注入结果
- **自定义 System Prompt**：根据上下文动态注入系统提示词
- **内容预处理**：图片压缩、格式转换、敏感信息过滤等

### 2.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/store/chat.ts` | 消息处理核心逻辑 | `onUserInput()` 第 407-528 行 |
| `app/store/chat.ts` | 消息上下文组装 | `getMessagesWithMemory()` 第 530-640 行 |
| `app/store/chat.ts` | 模板填充 | `fillTemplateWith()` 第 161-203 行 |
| `app/utils/chat.ts` | 消息工具函数 | 整个文件 |
| `app/utils/checkers.ts` | 模型能力检测 | `isVisionModel()` 等函数 |

### 2.3 开发模式

#### 模式一：消息发送前拦截

**核心入口**：`app/store/chat.ts` 的 `onUserInput()` 方法

```typescript
// app/store/chat.ts:407-434
async onUserInput(
  content: string,
  attachImages?: string[],
  isMcpResponse?: boolean,
) {
  const session = get().currentSession();
  const modelConfig = session.mask.modelConfig;

  // ========== 拦截点 1：原始内容处理 ==========
  // 在这里可以对 content 进行预处理
  // 例如：识别特殊命令、调用外部 API、内容过滤等

  let mContent: string | MultimodalContent[] = isMcpResponse
    ? content
    : fillTemplateWith(content, modelConfig);

  // ========== 拦截点 2：多模态内容组装 ==========
  if (!isMcpResponse && attachImages && attachImages.length > 0) {
    mContent = [
      ...(content ? [{ type: "text" as const, text: content }] : []),
      ...attachImages.map((url) => ({
        type: "image_url" as const,
        image_url: { url },
      })),
    ];
  }

  // 后续创建消息并发送...
}
```

**扩展方式**：

```typescript
// 示例：在发送前调用搜索 API
async onUserInput(content: string, attachImages?: string[]) {
  // 检测是否需要联网搜索
  if (content.includes("/search")) {
    const query = content.replace("/search", "").trim();
    const searchResults = await yourSearchAPI(query);
    content = `${content}\n\n搜索结果：\n${searchResults}`;
  }

  // 继续原有逻辑...
}
```

#### 模式二：System Prompt 动态注入

**核心入口**：`app/store/chat.ts` 的 `getMessagesWithMemory()` 方法

```typescript
// app/store/chat.ts:550-588
async getMessagesWithMemory() {
  // ...前置逻辑...

  const mcpEnabled = await isMcpEnabled();
  const mcpSystemPrompt = mcpEnabled ? await getMcpSystemPrompt() : "";

  var systemPrompts: ChatMessage[] = [];

  if (shouldInjectSystemPrompts) {
    systemPrompts = [
      createMessage({
        role: "system",
        content:
          fillTemplateWith("", {
            ...modelConfig,
            template: DEFAULT_SYSTEM_TEMPLATE,
          }) + mcpSystemPrompt,
      }),
    ];
  }

  // ========== 扩展点：添加自定义 System Prompt ==========
  // 在 systemPrompts 数组中添加额外的系统提示

  // 最终消息组装
  const recentMessages = [
    ...systemPrompts,           // 系统提示
    ...longTermMemoryPrompts,   // 长期记忆
    ...contextPrompts,          // 上下文提示（来自 Mask）
    ...reversedRecentMessages.reverse(),  // 历史消息
  ];

  return recentMessages;
}
```

**扩展示例**：

```typescript
// 添加自定义系统提示
const customSystemPrompt = createMessage({
  role: "system",
  content: "你是一个专业的翻译助手，请将用户的输入翻译成英文。",
});

// 插入到 systemPrompts 数组
systemPrompts.push(customSystemPrompt);
```

#### 模式三：文件内容注入

**步骤概览**：

1. **UI 层**：在 `app/components/chat.tsx` 添加文件上传入口
2. **读取文件**：使用 FileReader API 读取文件内容
3. **注入消息**：将文件内容作为上下文添加到消息中

```typescript
// 文件读取示例
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 在消息中注入文件内容
const fileContent = await readFileContent(file);
const enhancedContent = `以下是文件 ${file.name} 的内容：\n\`\`\`\n${fileContent}\n\`\`\`\n\n用户问题：${userInput}`;
```

#### 模式四：模板变量扩展

**核心函数**：`fillTemplateWith()`

```typescript
// app/store/chat.ts:161-203
function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
    // ========== 扩展点：添加自定义变量 ==========
    // customVar: "your value",
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString());
  });

  return output;
}
```

### 2.4 约定与规范

1. **消息不可变性**：修改消息时使用 `createMessage()` 创建新对象
2. **异步处理**：拦截逻辑如需异步操作，确保在 `await` 完成后再继续
3. **错误处理**：拦截逻辑的错误不应阻断主流程，使用 try-catch 包装
4. **性能考虑**：避免在热路径中进行耗时操作，考虑使用缓存
5. **类型安全**：使用 `MultimodalContent` 类型处理图片等多模态内容

### 2.5 示例参考

| 功能 | 参考文件 | 说明 |
|------|----------|------|
| MCP 工具调用 | `app/store/chat.ts:205-224` | `getMcpSystemPrompt()` 动态生成工具提示 |
| 图片预处理 | `app/utils/chat.ts` | `preProcessImageContent()` 处理图片 |
| 记忆总结 | `app/store/chat.ts:661-750` | `summarizeSession()` 自动总结对话 |

---

## 第三章：状态管理与数据持久化域

### 3.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **新建 Store**：管理新功能的全局状态
- **数据持久化**：将数据保存到 IndexedDB
- **版本迁移**：处理数据结构变更时的兼容性
- **跨组件状态共享**：多个组件共享同一状态

### 3.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/utils/store.ts` | Store 工厂函数 | `createPersistStore()` 第 29-78 行 |
| `app/utils/indexedDB-storage.ts` | IndexedDB 封装 | 整个文件（约 48 行） |
| `app/constant.ts` | Store Key 枚举 | `StoreKey` 第 90-101 行 |
| `app/store/*.ts` | 各个 Store 实现 | 作为参考示例 |

### 3.3 开发模式

#### 模式一：新建 Zustand Store

**步骤概览**：

1. **定义 StoreKey**：在 `app/constant.ts` 中添加唯一键名

```typescript
// app/constant.ts:90-101
export enum StoreKey {
  Chat = "chat-next-web-store",
  Plugin = "chat-next-web-plugin",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
  SdList = "sd-list",
  Mcp = "mcp-store",
  // 添加你的 Store Key
  YourFeature = "your-feature-store",
}
```

2. **创建 Store 文件**：使用 `createPersistStore()` 工厂函数

```typescript
// app/store/your-feature.ts
import { createPersistStore } from "../utils/store";
import { StoreKey } from "../constant";

// 1. 定义默认状态
const DEFAULT_YOUR_FEATURE_STATE = {
  items: [] as YourItem[],
  settings: {
    enabled: true,
    maxItems: 100,
  },
};

// 2. 定义类型
export type YourFeatureState = typeof DEFAULT_YOUR_FEATURE_STATE;

// 3. 创建 Store
export const useYourFeatureStore = createPersistStore(
  DEFAULT_YOUR_FEATURE_STATE,

  // 方法定义
  (set, get) => ({
    // 添加项目
    addItem(item: YourItem) {
      set((state) => ({
        items: [...state.items, item],
      }));
    },

    // 删除项目
    removeItem(id: string) {
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
    },

    // 更新设置
    updateSettings(settings: Partial<YourFeatureState["settings"]>) {
      set((state) => ({
        settings: { ...state.settings, ...settings },
      }));
    },

    // 清空
    clear() {
      set({ items: [] });
    },
  }),

  // 持久化选项
  {
    name: StoreKey.YourFeature,
    version: 1,

    // 版本迁移函数
    migrate(persistedState, version) {
      const state = persistedState as YourFeatureState;

      if (version < 1) {
        // 从版本 0 迁移到版本 1
        // 处理数据结构变更
      }

      return state;
    },
  },
);
```

#### 模式二：理解 createPersistStore 工厂函数

```typescript
// app/utils/store.ts:29-78
export function createPersistStore<T extends object, M>(
  state: T,                    // 默认状态
  methods: (set, get) => M,    // 方法定义
  persistOptions: {            // 持久化选项
    name: string,              // 存储键名
    version?: number,          // 版本号
    migrate?: Function,        // 迁移函数
  },
) {
  // 自动配置 IndexedDB 存储
  persistOptions.storage = createJSONStorage(() => indexedDBStorage);

  // 自动处理 hydration 状态
  persistOptions.onRehydrateStorage = (state) => {
    return () => state.setHasHydrated(true);
  };

  return create(
    persist(
      combine(
        {
          ...state,
          lastUpdateTime: 0,        // 自动添加更新时间
          _hasHydrated: false,      // 自动添加 hydration 状态
        },
        (set, get) => ({
          ...methods(set, get),

          // 自动添加的方法
          markUpdate() { /* 标记更新时间 */ },
          update(updater) { /* 深拷贝更新 */ },
          setHasHydrated(state) { /* 设置 hydration 状态 */ },
        }),
      ),
      persistOptions,
    ),
  );
}
```

#### 模式三：IndexedDB 与 LocalStorage 降级

```typescript
// app/utils/indexedDB-storage.ts
class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    try {
      // 优先使用 IndexedDB
      const value = (await get(name)) || localStorage.getItem(name);
      return value;
    } catch (error) {
      // 降级到 localStorage
      return localStorage.getItem(name);
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    try {
      // 检查 hydration 状态，避免覆盖未加载的数据
      const _value = JSON.parse(value);
      if (!_value?.state?._hasHydrated) {
        console.warn("skip setItem", name);
        return;
      }
      await set(name, value);
    } catch (error) {
      localStorage.setItem(name, value);
    }
  }
}
```

#### 模式四：版本迁移策略

```typescript
// 版本迁移示例
migrate(persistedState, version) {
  const state = persistedState as YourFeatureState;

  // 版本 0 → 1：添加新字段
  if (version < 1) {
    state.newField = "default value";
  }

  // 版本 1 → 2：重命名字段
  if (version < 2) {
    state.renamedField = state.oldField;
    delete state.oldField;
  }

  // 版本 2 → 3：数据结构变更
  if (version < 3) {
    state.items = state.items.map(item => ({
      ...item,
      newProperty: computeNewProperty(item),
    }));
  }

  return state;
}
```

### 3.4 约定与规范

1. **Store 命名**：使用 `use[Feature]Store` 格式，如 `useChatStore`
2. **StoreKey 命名**：使用 kebab-case，如 `"chat-next-web-store"`
3. **不可变更新**：使用 `set()` 返回新对象，不直接修改 state
4. **深拷贝**：使用 `get().update()` 方法时会自动深拷贝
5. **版本号**：每次数据结构变更时递增版本号
6. **Hydration 检查**：在使用 store 前检查 `_hasHydrated`

```typescript
// Hydration 检查示例
const store = useYourFeatureStore();

if (!store._hasHydrated) {
  return <Loading />;
}

// 正常渲染
return <YourComponent data={store.items} />;
```

### 3.5 示例参考

| Store | 文件路径 | 特点 |
|-------|----------|------|
| `useChatStore` | `app/store/chat.ts` | 复杂状态管理，消息和会话 |
| `useAccessStore` | `app/store/access.ts` | API 密钥管理，敏感数据 |
| `useAppConfig` | `app/store/config.ts` | 全局配置，模型设置 |
| `useMaskStore` | `app/store/mask.ts` | Mask 模板管理 |
| `usePluginStore` | `app/store/plugin.ts` | 插件状态管理 |
| `useMcpStore` | `app/store/mcp.ts` | MCP 客户端状态 |

---

## 第四章：Tauri 系统集成域

### 4.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **自定义 Rust 命令**：调用系统级 API、执行性能敏感操作
- **系统事件监听**：监听剪贴板变化、全局快捷键、窗口事件
- **多窗口管理**：创建独立窗口、窗口间通信
- **全局快捷键**：注册系统级热键
- **子进程管理**：启动和管理外部程序

### 4.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `src-tauri/src/main.rs` | Tauri 入口，命令注册 | 整个文件（约 13 行） |
| `src-tauri/src/stream.rs` | 流式命令示例 | `stream_fetch` 命令（第 34-144 行） |
| `src-tauri/Cargo.toml` | Rust 依赖配置 | 依赖列表（第 17-43 行） |
| `src-tauri/tauri.conf.json` | Tauri 功能权限 | `allowlist`（第 15-58 行） |
| `app/global.d.ts` | TypeScript 类型定义 | `Window.__TAURI__`（第 13-43 行） |
| `app/utils/stream.ts` | 前端调用封装 | `fetch()` 函数（第 22-108 行） |

### 4.3 开发模式

#### 模式一：新增 Rust 命令

**步骤概览**：

1. **定义 Rust 命令**：在 `src-tauri/src/` 下创建模块

```rust
// src-tauri/src/your_command.rs
use tauri::command;

// 基础命令示例
#[tauri::command]
pub fn your_command(arg1: String, arg2: i32) -> Result<String, String> {
    // 执行逻辑
    Ok(format!("Result: {} - {}", arg1, arg2))
}

// 异步命令示例
#[tauri::command]
pub async fn your_async_command(
    window: tauri::Window,  // 可选：获取窗口引用
    app: tauri::AppHandle,  // 可选：获取应用句柄
    arg: String,
) -> Result<String, String> {
    // 异步逻辑
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

    // 发送事件到前端
    window.emit("your-event", "payload").map_err(|e| e.to_string())?;

    Ok("done".to_string())
}
```

2. **注册命令**：在 `main.rs` 中注册

```rust
// src-tauri/src/main.rs
mod stream;
mod your_command;  // 引入你的模块

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            stream::stream_fetch,
            your_command::your_command,      // 注册命令
            your_command::your_async_command,
        ])
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

3. **配置权限**：在 `tauri.conf.json` 中启用所需功能

```json
// src-tauri/tauri.conf.json:15-58
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true,
        "execute": true,        // 如需执行命令
        "sidecar": true         // 如需 sidecar
      },
      "fs": {
        "all": true             // 如需文件系统访问
      },
      "notification": {
        "all": true             // 如需系统通知
      },
      "globalShortcut": {
        "all": true             // 如需全局快捷键
      }
    }
  }
}
```

4. **添加 TypeScript 类型**：在 `global.d.ts` 中扩展

```typescript
// app/global.d.ts
declare interface Window {
  __TAURI__?: {
    invoke(command: string, payload?: Record<string, unknown>): Promise<any>;
    // 添加你的命令类型
    // 或者在调用处使用泛型
  };
}
```

5. **前端调用**：

```typescript
// 在组件中调用
async function callYourCommand() {
  if (window.__TAURI__) {
    const result = await window.__TAURI__.invoke("your_command", {
      arg1: "hello",
      arg2: 42,
    });
    console.log(result);
  }
}
```

#### 模式二：流式数据传输

**参考实现**：`stream_fetch` 命令

```rust
// src-tauri/src/stream.rs:34-144
#[tauri::command]
pub async fn stream_fetch(
    window: tauri::Window,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
) -> Result<StreamResponse, String> {
    let event_name = "stream-response";
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);

    // ... 发送 HTTP 请求 ...

    // 在异步任务中流式发送数据
    tauri::async_runtime::spawn(async move {
        let mut stream = res.bytes_stream();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    // 发送数据块到前端
                    window.emit(event_name, ChunkPayload {
                        request_id,
                        chunk: bytes
                    }).ok();
                }
                Err(err) => {
                    println!("Error chunk: {:?}", err);
                }
            }
        }
        // 发送结束信号
        window.emit(event_name, EndPayload { request_id, status: 0 }).ok();
    });

    Ok(response)
}
```

**前端监听**：

```typescript
// app/utils/stream.ts:49-67
window.__TAURI__.event
    .listen("stream-response", (e: ResponseEvent) =>
        requestIdPromise.then((request_id) => {
            const { request_id: rid, chunk, status } = e?.payload || {};
            if (request_id != rid) {
                return;  // 忽略其他请求的响应
            }
            if (chunk) {
                // 处理数据块
                writer.write(new Uint8Array(chunk));
            } else if (status === 0) {
                // 结束信号
                close();
            }
        }),
    )
    .then((u: Function) => (unlisten = u));
```

#### 模式三：系统事件监听

**全局快捷键示例**：

```rust
// Rust 端注册快捷键
use tauri::{GlobalShortcutManager, Manager};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            // 注册全局快捷键
            app.global_shortcut_manager()
                .register("CmdOrCtrl+Shift+Space", move || {
                    // 发送事件到前端
                    handle.emit_all("global-shortcut", "triggered").ok();
                })
                .expect("failed to register shortcut");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error");
}
```

**前端监听**：

```typescript
// 监听快捷键事件
import { listen } from "@tauri-apps/api/event";

async function setupShortcutListener() {
    await listen("global-shortcut", (event) => {
        console.log("Shortcut triggered:", event.payload);
        // 执行操作
    });
}
```

#### 模式四：多窗口管理

**创建新窗口**：

```typescript
import { WebviewWindow } from "@tauri-apps/api/window";

async function createNewWindow() {
    const webview = new WebviewWindow("unique-label", {
        url: "/#/your-route",
        width: 800,
        height: 600,
        title: "New Window",
        decorations: true,
        resizable: true,
    });

    // 监听窗口事件
    webview.once("tauri://created", () => {
        console.log("Window created");
    });

    webview.once("tauri://error", (e) => {
        console.error("Window creation failed:", e);
    });
}
```

**窗口间通信**：

```typescript
// 窗口 A 发送消息
import { emit } from "@tauri-apps/api/event";
await emit("cross-window-message", { data: "hello" });

// 窗口 B 接收消息
import { listen } from "@tauri-apps/api/event";
await listen("cross-window-message", (event) => {
    console.log("Received:", event.payload);
});
```

#### 模式五：系统通知

```typescript
// app/global.d.ts 中已定义类型
if (window.__TAURI__?.notification) {
    // 检查权限
    const permissionGranted = await window.__TAURI__.notification.isPermissionGranted();

    if (!permissionGranted) {
        const permission = await window.__TAURI__.notification.requestPermission();
        if (permission !== "granted") return;
    }

    // 发送通知
    window.__TAURI__.notification.sendNotification({
        title: "NextChat",
        body: "你有一条新消息",
        icon: "icons/icon.png",
    });
}
```

### 4.4 约定与规范

1. **命令命名**：使用 snake_case，如 `stream_fetch`、`your_command`
2. **错误处理**：命令返回 `Result<T, String>`，错误信息会传递到前端
3. **事件命名**：使用 kebab-case，如 `stream-response`、`your-event`
4. **权限最小化**：只在 `allowlist` 中启用必需的功能
5. **异步优先**：IO 密集型操作使用 `async` 命令
6. **类型同步**：确保 Rust 和 TypeScript 的类型定义一致

### 4.5 示例参考

| 功能 | 参考文件 | 说明 |
|------|----------|------|
| 流式请求 | `src-tauri/src/stream.rs` | 完整的流式 HTTP 请求示例 |
| 前端流封装 | `app/utils/stream.ts` | TransformStream 封装 |
| 窗口配置 | `src-tauri/tauri.conf.json` | 窗口和权限配置 |
| 类型定义 | `app/global.d.ts` | Tauri API 类型声明 |

### 4.6 添加 Rust 依赖

在 `src-tauri/Cargo.toml` 中添加依赖：

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "1.5.4", features = [...] }

# 常用依赖
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = "0.11"           # HTTP 客户端
tokio = { version = "1", features = ["full"] }  # 异步运行时
futures-util = "0.3"       # Stream 扩展
bytes = "1.7"              # 字节处理
```

---

## 第五章：外部 API 与网络请求域

### 5.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **新增 LLM Provider**：接入新的 AI 服务提供商
- **新增 API Route**：创建后端代理接口
- **流式/非流式请求**：处理 SSE 流式响应
- **WebSocket 长连接**：实现实时双向通信

### 5.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/api/[provider]/[...path]/route.ts` | 动态路由代理入口 | 整个文件（约 86 行） |
| `app/api/openai.ts` | OpenAI 代理示例 | `handle()` 函数 |
| `app/client/api.ts` | LLMApi 抽象类定义 | 第 108-113 行 |
| `app/client/platforms/*.ts` | 各 Provider 实现 | 各平台实现 |
| `app/utils/stream.ts` | 流式 Fetch 封装 | `fetch()` 函数 |
| `app/constant.ts` | ApiPath 枚举 | 第 59-78 行 |

### 5.3 开发模式

#### 模式一：新增 LLM Provider（完整流程）

**步骤概览**：

1. **添加常量定义**：在 `app/constant.ts` 中添加

```typescript
// app/constant.ts

// 1. 添加 BASE_URL
export const YOUR_PROVIDER_BASE_URL = "https://api.your-provider.com";

// 2. 添加 ApiPath
export enum ApiPath {
  // ...existing paths...
  YourProvider = "/api/your-provider",
}

// 3. 添加 ModelProvider
export enum ModelProvider {
  // ...existing providers...
  YourProvider = "YourProvider",
}

// 4. 添加模型到 DEFAULT_MODELS
export const DEFAULT_MODELS: readonly LLMModel[] = [
  // ...existing models...
  {
    name: "your-model-name",
    available: true,
    provider: {
      id: "your-provider",
      providerName: "YourProvider",
      providerType: "your-provider",
      sorted: 100,
    },
  },
];
```

2. **创建 Client 实现**：在 `app/client/platforms/` 下创建

```typescript
// app/client/platforms/your-provider.ts
import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  LLMUsage,
  SpeechOptions,
} from "../api";
import { fetch } from "@/app/utils/stream";

export class YourProviderApi implements LLMApi {
  // 构建请求路径
  path(path: string): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = accessStore.yourProviderUrl || YOUR_PROVIDER_BASE_URL;

    // 判断是否使用代理
    if (!accessStore.useCustomConfig) {
      baseUrl = ApiPath.YourProvider;
    }

    return `${baseUrl}/${path}`;
  }

  // 核心：Chat 方法
  async chat(options: ChatOptions): Promise<void> {
    const messages = options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const requestPayload = {
      model: options.config.model,
      messages,
      temperature: options.config.temperature,
      stream: options.config.stream,
    };

    const controller = new AbortController();
    options.onController?.(controller);

    const response = await fetch(this.path("v1/chat/completions"), {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    if (options.config.stream) {
      // 流式处理
      await this.handleStreamResponse(response, options);
    } else {
      // 非流式处理
      const json = await response.json();
      options.onFinish(json.choices[0].message.content, response);
    }
  }

  // 流式响应处理
  private async handleStreamResponse(
    response: Response,
    options: ChatOptions,
  ) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let content = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // 解析 SSE 格式
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices[0]?.delta?.content || "";
            content += delta;
            options.onUpdate?.(content, delta);
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    options.onFinish(content, response);
  }

  // 语音合成（可选）
  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Not implemented");
  }

  // 用量查询（可选）
  async usage(): Promise<LLMUsage> {
    return { used: 0, total: 0 };
  }

  // 模型列表
  async models(): Promise<LLMModel[]> {
    return [];  // 返回空数组使用默认模型
  }
}
```

3. **注册到 ClientApi**：在 `app/client/api.ts` 中添加

```typescript
// app/client/api.ts:139-183
import { YourProviderApi } from "./platforms/your-provider";

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    switch (provider) {
      // ...existing cases...
      case ModelProvider.YourProvider:
        this.llm = new YourProviderApi();
        break;
      default:
        this.llm = new ChatGPTApi();
    }
  }
}
```

4. **创建 API Route**：在 `app/api/` 下创建

```typescript
// app/api/your-provider.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { YOUR_PROVIDER_BASE_URL } from "@/app/constant";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const serverConfig = getServerSideConfig();

  // 鉴权检查
  const authToken = req.headers.get("Authorization");
  if (!authToken && !serverConfig.yourProviderApiKey) {
    return NextResponse.json(
      { error: "Missing API Key" },
      { status: 401 },
    );
  }

  // 构建目标 URL
  const path = params.path.join("/");
  const targetUrl = `${YOUR_PROVIDER_BASE_URL}/${path}`;

  // 代理请求
  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${serverConfig.yourProviderApiKey}`);
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

5. **注册路由处理**：在 `app/api/[provider]/[...path]/route.ts` 中添加

```typescript
// app/api/[provider]/[...path]/route.ts
import { handle as yourProviderHandler } from "../../your-provider";

async function handle(req, { params }) {
  const apiPath = `/api/${params.provider}`;
  switch (apiPath) {
    // ...existing cases...
    case ApiPath.YourProvider:
      return yourProviderHandler(req, { params });
    // ...
  }
}
```

#### 模式二：流式响应处理

**Web 模式**：使用标准 Fetch + ReadableStream

```typescript
// 标准 SSE 流式处理
const response = await fetch(url, options);
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (reader) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  // 处理 SSE 数据
  processSSE(text);
}
```

**Tauri 模式**：使用封装的 `fetch` 函数

```typescript
// app/utils/stream.ts 提供的封装
import { fetch } from "@/app/utils/stream";

// 自动选择 Tauri 或 Web 模式
const response = await fetch(url, {
  method: "POST",
  headers: { ... },
  body: JSON.stringify(payload),
  signal: controller.signal,
});
```

#### 模式三：非流式请求（O1/O3 模型）

```typescript
// 某些模型不支持流式，需特殊处理
const isO1Model = modelConfig.model.startsWith("o1-");

const requestPayload = {
  ...basePayload,
  stream: !isO1Model,  // O1 模型关闭流式
};

if (!requestPayload.stream) {
  // 非流式：直接等待完整响应
  const response = await fetch(url, options);
  const json = await response.json();
  const content = json.choices[0].message.content;
  options.onFinish(content, response);
} else {
  // 流式：逐块处理
  await handleStreamResponse(response, options);
}
```

### 5.4 约定与规范

1. **路径命名**：API 路径使用 kebab-case，如 `/api/your-provider`
2. **环境变量**：API Key 存储在服务端环境变量，命名为 `YOUR_PROVIDER_API_KEY`
3. **错误处理**：返回标准 HTTP 状态码和 JSON 错误信息
4. **CORS 处理**：代理模式下自动处理跨域
5. **超时控制**：使用 `AbortController` 管理请求超时
6. **类型安全**：实现 `LLMApi` 接口确保类型一致

### 5.5 示例参考

| Provider | Client 文件 | API Route 文件 | 特点 |
|----------|-------------|----------------|------|
| OpenAI | `app/client/platforms/openai.ts` | `app/api/openai.ts` | 最完整的实现，含图片、语音 |
| Anthropic | `app/client/platforms/anthropic.ts` | `app/api/anthropic.ts` | Claude 特殊格式处理 |
| Google | `app/client/platforms/google.ts` | `app/api/google.ts` | Gemini API 格式 |
| DeepSeek | `app/client/platforms/deepseek.ts` | `app/api/deepseek.ts` | 简洁的 OpenAI 兼容实现 |

---

## 第六章：工具函数与类型系统域

### 6.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **复用工具函数**：避免重复实现常用功能
- **扩展类型定义**：添加新的数据类型
- **JSON 协议解析**：处理 MCP 等协议的 JSON 数据
- **格式化与校验**：数据格式化、输入校验

### 6.2 关键文件映射

| 文件路径 | 职责 | 主要导出 |
|----------|------|----------|
| `app/utils/index.ts` | 工具函数入口 | 聚合导出 |
| `app/utils/format.ts` | 格式化工具 | `prettyObject()`, `formatDate()` |
| `app/utils/chat.ts` | 聊天相关工具 | `preProcessImageContent()` |
| `app/utils/checkers.ts` | 模型检测工具 | `isVisionModel()`, `isDalle3()` |
| `app/utils/token.ts` | Token 计算 | `estimateTokenLength()` |
| `app/utils/clone.ts` | 深拷贝 | `deepClone()` |
| `app/utils/merge.ts` | 对象合并 | `merge()` |
| `app/typing.ts` | 类型定义 | `Updater`, `MessageRole` 等 |
| `app/global.d.ts` | 全局类型扩展 | `Window.__TAURI__` |
| `app/client/api.ts` | API 相关类型 | `LLMApi`, `ChatOptions` 等 |

### 6.3 开发模式

#### 模式一：复用现有工具函数

**格式化工具**：

```typescript
import { prettyObject } from "@/app/utils/format";

// 将对象格式化为易读的 JSON 字符串
const formatted = prettyObject({
  error: true,
  message: "Something went wrong",
});
// 输出: "```json\n{\"error\":true,\"message\":\"Something went wrong\"}\n```"
```

**模型检测工具**：

```typescript
import {
  isVisionModel,
  isDalle3,
  isO1,
  getTimeoutMSByModel,
} from "@/app/utils";

// 检测是否为视觉模型
if (isVisionModel(modelName)) {
  // 处理图片输入
}

// 检测是否为 DALL-E 3
if (isDalle3(modelName)) {
  // 调用图片生成 API
}

// 检测是否为 O1 系列（不支持流式）
if (isO1(modelName)) {
  options.stream = false;
}

// 获取模型对应的超时时间
const timeout = getTimeoutMSByModel(modelName);
```

**聊天工具**：

```typescript
import {
  preProcessImageContent,
  uploadImage,
  getMessageTextContent,
} from "@/app/utils/chat";

// 预处理图片内容（压缩、格式转换）
const processedImages = await preProcessImageContent(imageContent);

// 上传图片
const url = await uploadImage(file);

// 提取消息文本内容（处理多模态消息）
const text = getMessageTextContent(message);
```

**深拷贝与合并**：

```typescript
import { deepClone } from "@/app/utils/clone";
import { merge } from "@/app/utils/merge";

// 深拷贝对象
const cloned = deepClone(originalObject);

// 深度合并对象
const merged = merge(defaultConfig, userConfig);
```

**Token 估算**：

```typescript
import { estimateTokenLength } from "@/app/utils/token";

// 估算文本的 token 数量
const tokens = estimateTokenLength(text);
```

#### 模式二：扩展类型定义

**在 `app/typing.ts` 中添加类型**：

```typescript
// app/typing.ts

// 已有类型
export type Updater<T> = (updater: (value: T) => void) => void;
export type MessageRole = "system" | "user" | "assistant";

// 添加你的类型
export interface YourFeatureConfig {
  enabled: boolean;
  options: {
    maxItems: number;
    autoSave: boolean;
  };
}

export type YourFeatureStatus = "idle" | "loading" | "success" | "error";
```

**在 `app/client/api.ts` 中扩展 API 类型**：

```typescript
// 多模态内容类型
export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

// 聊天选项类型
export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

// LLM 抽象接口
export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}
```

**在 `app/global.d.ts` 中扩展全局类型**：

```typescript
// app/global.d.ts
declare interface Window {
  __TAURI__?: {
    invoke(command: string, payload?: Record<string, unknown>): Promise<any>;
    // 添加新的 Tauri API 类型
    yourFeature: {
      doSomething(): Promise<void>;
    };
  };

  // 添加其他全局类型
  __YOUR_FEATURE__?: {
    initialized: boolean;
    config: YourFeatureConfig;
  };
}
```

#### 模式三：JSON 协议解析（MCP 示例）

```typescript
// MCP 工具调用的 JSON 解析
interface McpToolCall {
  clientId: string;
  tool: string;
  arguments: Record<string, unknown>;
}

function parseMcpToolCall(content: string): McpToolCall | null {
  // 检测 MCP 工具调用格式: ```json:mcp:{clientId}
  const mcpPattern = /```json:mcp:(\w+)\n([\s\S]*?)```/;
  const match = content.match(mcpPattern);

  if (!match) return null;

  const clientId = match[1];
  const jsonContent = match[2];

  try {
    const parsed = JSON.parse(jsonContent);
    return {
      clientId,
      tool: parsed.tool,
      arguments: parsed.arguments || {},
    };
  } catch (e) {
    console.error("Failed to parse MCP tool call:", e);
    return null;
  }
}
```

#### 模式四：创建新的工具函数模块

```typescript
// app/utils/your-feature.ts

/**
 * 你的功能描述
 */
export function yourUtilityFunction(input: string): string {
  // 实现逻辑
  return processedInput;
}

/**
 * 异步工具函数
 */
export async function yourAsyncUtility(
  data: YourDataType,
): Promise<YourResultType> {
  // 异步实现
  return result;
}

/**
 * 校验函数
 */
export function validateYourInput(input: unknown): input is YourInputType {
  return (
    typeof input === "object" &&
    input !== null &&
    "requiredField" in input
  );
}
```

**在 `app/utils/index.ts` 中导出**：

```typescript
// app/utils/index.ts
export * from "./your-feature";
```

### 6.4 约定与规范

1. **函数命名**：使用 camelCase，动词开头，如 `isVisionModel()`, `getTimeoutMSByModel()`
2. **类型命名**：使用 PascalCase，如 `ChatOptions`, `LLMModel`
3. **文件组织**：相关功能放在同一文件，通过 `index.ts` 聚合导出
4. **文档注释**：公共函数使用 JSDoc 注释
5. **类型优先**：优先使用 TypeScript 类型，避免 `any`
6. **纯函数**：工具函数应尽量是纯函数，无副作用

### 6.5 示例参考

| 工具类型 | 文件路径 | 主要函数 |
|----------|----------|----------|
| 格式化 | `app/utils/format.ts` | `prettyObject()`, `copyToClipboard()` |
| 模型检测 | `app/utils/checkers.ts` | `isVisionModel()`, `isDalle3()` |
| 聊天处理 | `app/utils/chat.ts` | `preProcessImageContent()` |
| Token 计算 | `app/utils/token.ts` | `estimateTokenLength()` |
| 加密 | `app/utils/hmac.ts` | HMAC 签名相关 |
| 云服务 | `app/utils/cloudflare.ts` | Cloudflare AI Gateway |

---

## 第七章：子进程与外部程序通信域

### 7.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **Rust Sidecar**：运行外部程序（如 Python 脚本、Node.js 服务）
- **Stdio 通信**：通过标准输入输出与子进程通信
- **系统命令执行**：执行 shell 命令获取系统信息
- **Git 操作封装**：克隆、拉取仓库等操作

### 7.2 关键文件映射

| 文件路径 | 职责 | 说明 |
|----------|------|------|
| `src-tauri/src/main.rs` | 子进程注册入口 | 命令注册 |
| `src-tauri/Cargo.toml` | Rust 依赖配置 | 需添加相关依赖 |
| `src-tauri/tauri.conf.json` | Sidecar 配置 | `shell.sidecar` 配置 |
| `app/global.d.ts` | 前端类型定义 | 子进程调用类型 |

### 7.3 开发模式

#### 模式一：Rust Sidecar 子进程

**概念**：Sidecar 是与 Tauri 应用一起打包分发的外部程序（如 Python、Node.js 脚本）。

**步骤概览**：

1. **准备外部程序**：将外部程序放入 `src-tauri/binaries/` 目录

```
src-tauri/
├── binaries/
│   ├── your-script-x86_64-pc-windows-msvc.exe
│   ├── your-script-x86_64-apple-darwin
│   └── your-script-x86_64-unknown-linux-gnu
```

2. **配置 Sidecar**：在 `tauri.conf.json` 中配置

```json
// src-tauri/tauri.conf.json
{
  "tauri": {
    "bundle": {
      "externalBin": [
        "binaries/your-script"
      ]
    },
    "allowlist": {
      "shell": {
        "sidecar": true,
        "scope": [
          {
            "name": "binaries/your-script",
            "sidecar": true,
            "args": true
          }
        ]
      }
    }
  }
}
```

3. **添加 Rust 依赖**：

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "1.5.4", features = ["shell-sidecar", "shell-execute"] }
```

4. **创建 Rust 命令**：

```rust
// src-tauri/src/sidecar.rs
use tauri::api::process::{Command, CommandEvent};
use std::sync::mpsc;

#[tauri::command]
pub async fn run_sidecar(
    window: tauri::Window,
    args: Vec<String>,
) -> Result<String, String> {
    let (mut rx, mut _child) = Command::new_sidecar("your-script")
        .map_err(|e| e.to_string())?
        .args(&args)
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut output = String::new();

    // 监听子进程输出
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                output.push_str(&line);
                output.push('\n');
                // 可选：实时发送到前端
                window.emit("sidecar-output", &line).ok();
            }
            CommandEvent::Stderr(line) => {
                eprintln!("Sidecar stderr: {}", line);
            }
            CommandEvent::Terminated(payload) => {
                if payload.code != Some(0) {
                    return Err(format!("Sidecar exited with code: {:?}", payload.code));
                }
                break;
            }
            _ => {}
        }
    }

    Ok(output)
}
```

5. **注册命令**：

```rust
// src-tauri/src/main.rs
mod sidecar;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            sidecar::run_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error");
}
```

6. **前端调用**：

```typescript
// 调用 sidecar
async function runScript(args: string[]) {
    if (window.__TAURI__) {
        const result = await window.__TAURI__.invoke("run_sidecar", { args });
        console.log("Result:", result);
    }
}

// 监听实时输出
import { listen } from "@tauri-apps/api/event";

await listen("sidecar-output", (event) => {
    console.log("Output:", event.payload);
});
```

#### 模式二：Stdio 通信协议

**适用场景**：需要与子进程进行双向 JSON 通信（如 MCP 协议）

```rust
// src-tauri/src/stdio_comm.rs
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    method: String,
    params: serde_json::Value,
    id: u32,
}

#[derive(Serialize, Deserialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
    id: u32,
}

#[tauri::command]
pub async fn call_external_tool(
    method: String,
    params: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let mut child = Command::new("your-tool")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdin = child.stdin.as_mut().ok_or("Failed to open stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;

    // 发送 JSON-RPC 请求
    let request = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        method,
        params,
        id: 1,
    };

    let request_str = serde_json::to_string(&request)
        .map_err(|e| e.to_string())?;

    writeln!(stdin, "{}", request_str)
        .map_err(|e| e.to_string())?;

    // 读取响应
    let reader = BufReader::new(stdout);
    for line in reader.lines() {
        let line = line.map_err(|e| e.to_string())?;
        if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(&line) {
            if let Some(result) = response.result {
                return Ok(result);
            }
            if let Some(error) = response.error {
                return Err(error.to_string());
            }
        }
    }

    Err("No response received".to_string())
}
```

#### 模式三：系统命令执行

```rust
// src-tauri/src/shell.rs
use std::process::Command;

#[tauri::command]
pub fn execute_command(
    command: String,
    args: Vec<String>,
) -> Result<String, String> {
    let output = Command::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if output.status.success() {
        String::from_utf8(output.stdout)
            .map_err(|e| e.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Command failed: {}", stderr))
    }
}

// 获取系统信息示例
#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let hostname = hostname::get()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string();

    Ok(SystemInfo {
        hostname,
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    })
}

#[derive(serde::Serialize)]
pub struct SystemInfo {
    hostname: String,
    os: String,
    arch: String,
}
```

#### 模式四：Git 操作封装

```rust
// src-tauri/src/git.rs
use std::process::Command;
use std::path::Path;

#[tauri::command]
pub async fn git_clone(
    url: String,
    target_dir: String,
    window: tauri::Window,
) -> Result<(), String> {
    // 检查目标目录
    let path = Path::new(&target_dir);
    if path.exists() {
        return Err("Target directory already exists".to_string());
    }

    let output = Command::new("git")
        .args(["clone", "--progress", &url, &target_dir])
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;

    if output.status.success() {
        window.emit("git-clone-complete", &target_dir).ok();
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Git clone failed: {}", stderr))
    }
}

#[tauri::command]
pub async fn git_pull(repo_dir: String) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(&repo_dir)
        .args(["pull", "--rebase"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        String::from_utf8(output.stdout).map_err(|e| e.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

#[tauri::command]
pub fn list_local_repos(base_dir: String) -> Result<Vec<RepoInfo>, String> {
    let mut repos = Vec::new();
    let base_path = Path::new(&base_dir);

    if !base_path.exists() {
        return Ok(repos);
    }

    for entry in std::fs::read_dir(base_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_dir() && path.join(".git").exists() {
            repos.push(RepoInfo {
                name: path.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    Ok(repos)
}

#[derive(serde::Serialize)]
pub struct RepoInfo {
    name: String,
    path: String,
}
```

### 7.4 约定与规范

1. **Sidecar 命名**：二进制文件必须包含目标平台后缀，如 `-x86_64-pc-windows-msvc`
2. **错误处理**：所有命令返回 `Result<T, String>`
3. **异步优先**：长时间运行的命令使用 `async`
4. **进度反馈**：使用 `window.emit()` 发送进度事件
5. **资源清理**：确保子进程正确终止，避免僵尸进程
6. **权限配置**：在 `tauri.conf.json` 中正确配置 `shell` 权限

### 7.5 示例参考

| 功能 | 实现要点 |
|------|----------|
| Python 插件系统 | Sidecar + Stdio JSON-RPC 通信 |
| Git 插件市场 | shell 命令执行 git clone/pull |
| 系统监控工具 | 定期执行系统命令获取信息 |
| AI 电脑工具 | 执行系统命令 + 结果返回 AI |

---

## 第八章：实时推送与通知域

### 8.1 场景描述

当你需要开发以下类型功能时，需要掌握本领域知识：

- **服务端推送**：后端主动推送消息到前端
- **WebSocket/SSE**：建立长连接接收实时数据
- **系统通知**：调用操作系统通知 API
- **定时任务提醒**：如 AI 日程管家

### 8.2 关键文件映射

| 文件路径 | 职责 | 关键代码位置 |
|----------|------|--------------|
| `app/store/update.ts` | 通知调用示例 | 第 92-129 行 |
| `app/utils/stream.ts` | SSE 流式处理 | 整个文件 |
| `app/global.d.ts` | notification API 类型 | 第 24-28 行 |

### 8.3 开发模式

#### 模式一：系统通知调用

**参考实现**：`app/store/update.ts`

```typescript
// 检查和发送系统通知
async function sendSystemNotification(title: string, body: string) {
    if (!window.__TAURI__?.notification) {
        // Web 环境：使用 Web Notification API
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification(title, { body });
            }
        }
        return;
    }

    // Tauri 环境：使用原生通知
    const granted = await window.__TAURI__.notification.isPermissionGranted();

    if (!granted) {
        const permission = await window.__TAURI__.notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return;
        }
    }

    window.__TAURI__.notification.sendNotification({
        title,
        body,
        icon: "icons/icon.png",  // 可选：通知图标
        sound: "Default",        // 可选：通知声音
    });
}
```

**实际使用示例**（来自 `update.ts`）：

```typescript
// app/store/update.ts:92-129
if (window.__TAURI__?.notification && isApp) {
    await window.__TAURI__?.notification
        .isPermissionGranted()
        .then((granted) => {
            if (!granted) return;

            window.__TAURI__?.notification
                .requestPermission()
                .then((permission) => {
                    if (permission === "granted") {
                        if (version === remoteId) {
                            window.__TAURI__?.notification.sendNotification({
                                title: "NextChat",
                                body: `${Locale.Settings.Update.IsLatest}`,
                                icon: `${ChatGptIcon.src}`,
                                sound: "Default",
                            });
                        } else {
                            window.__TAURI__?.notification.sendNotification({
                                title: "NextChat",
                                body: Locale.Settings.Update.FoundUpdate(`${remoteId}`),
                                icon: `${ChatGptIcon.src}`,
                                sound: "Default",
                            });
                        }
                    }
                });
        });
}
```

#### 模式二：Server-Sent Events (SSE)

**创建 SSE 连接**：

```typescript
// 建立 SSE 连接
function createSSEConnection(url: string, onMessage: (data: any) => void) {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log("SSE connection opened");
    };

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error("Failed to parse SSE data:", e);
        }
    };

    eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();

        // 可选：自动重连
        setTimeout(() => {
            createSSEConnection(url, onMessage);
        }, 5000);
    };

    return eventSource;
}

// 使用示例
const sse = createSSEConnection("/api/events", (data) => {
    if (data.type === "reminder") {
        sendSystemNotification("提醒", data.message);
    }
});

// 关闭连接
// sse.close();
```

**Next.js API Route SSE 示例**：

```typescript
// app/api/events/route.ts
export async function GET(req: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // 发送初始连接确认
            controller.enqueue(
                encoder.encode("data: {\"type\":\"connected\"}\n\n")
            );

            // 定时发送心跳
            const heartbeat = setInterval(() => {
                controller.enqueue(
                    encoder.encode("data: {\"type\":\"ping\"}\n\n")
                );
            }, 30000);

            // 示例：模拟定时提醒
            const reminder = setTimeout(() => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                        type: "reminder",
                        message: "该休息一下了！",
                        time: new Date().toISOString(),
                    })}\n\n`)
                );
            }, 60000);

            // 清理函数
            req.signal.addEventListener("abort", () => {
                clearInterval(heartbeat);
                clearTimeout(reminder);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
```

#### 模式三：WebSocket 长连接

**建立 WebSocket 连接**：

```typescript
// WebSocket 管理器
class WebSocketManager {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private messageHandlers: Map<string, Function[]> = new Map();

    connect(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error("Failed to parse message:", e);
            }
        };

        this.ws.onclose = () => {
            console.log("WebSocket closed");
            this.tryReconnect(url);
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    private tryReconnect(url: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

            setTimeout(() => {
                console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
                this.connect(url);
            }, delay);
        }
    }

    private handleMessage(message: { type: string; payload: any }) {
        const handlers = this.messageHandlers.get(message.type) || [];
        handlers.forEach((handler) => handler(message.payload));
    }

    on(type: string, handler: Function) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type)!.push(handler);
    }

    send(type: string, payload: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    close() {
        this.ws?.close();
    }
}

// 使用示例
const wsManager = new WebSocketManager();
wsManager.connect("wss://your-server.com/ws");

wsManager.on("reminder", (payload) => {
    sendSystemNotification("日程提醒", payload.message);
});

wsManager.on("message", (payload) => {
    // 处理新消息
});
```

#### 模式四：定时任务与提醒

```typescript
// 使用 Store 管理定时任务
import { createPersistStore } from "../utils/store";

interface Reminder {
    id: string;
    title: string;
    time: number;  // timestamp
    repeat?: "daily" | "weekly" | "monthly";
    enabled: boolean;
}

export const useReminderStore = createPersistStore(
    {
        reminders: [] as Reminder[],
        activeTimers: {} as Record<string, NodeJS.Timeout>,
    },
    (set, get) => ({
        addReminder(reminder: Omit<Reminder, "id">) {
            const id = nanoid();
            set((state) => ({
                reminders: [...state.reminders, { ...reminder, id }],
            }));

            // 设置定时器
            this.scheduleReminder({ ...reminder, id });

            return id;
        },

        scheduleReminder(reminder: Reminder) {
            if (!reminder.enabled) return;

            const now = Date.now();
            const delay = reminder.time - now;

            if (delay <= 0) return;

            const timerId = setTimeout(async () => {
                // 发送通知
                await sendSystemNotification("提醒", reminder.title);

                // 处理重复提醒
                if (reminder.repeat) {
                    const nextTime = this.calculateNextTime(reminder);
                    set((state) => ({
                        reminders: state.reminders.map((r) =>
                            r.id === reminder.id
                                ? { ...r, time: nextTime }
                                : r
                        ),
                    }));
                    this.scheduleReminder({ ...reminder, time: nextTime });
                }
            }, delay);

            set((state) => ({
                activeTimers: {
                    ...state.activeTimers,
                    [reminder.id]: timerId,
                },
            }));
        },

        calculateNextTime(reminder: Reminder): number {
            const now = Date.now();
            switch (reminder.repeat) {
                case "daily":
                    return now + 24 * 60 * 60 * 1000;
                case "weekly":
                    return now + 7 * 24 * 60 * 60 * 1000;
                case "monthly":
                    return now + 30 * 24 * 60 * 60 * 1000;
                default:
                    return now;
            }
        },

        removeReminder(id: string) {
            const timer = get().activeTimers[id];
            if (timer) {
                clearTimeout(timer);
            }

            set((state) => ({
                reminders: state.reminders.filter((r) => r.id !== id),
                activeTimers: Object.fromEntries(
                    Object.entries(state.activeTimers).filter(([key]) => key !== id)
                ),
            }));
        },

        // 应用启动时恢复定时器
        initializeReminders() {
            const reminders = get().reminders.filter((r) => r.enabled);
            reminders.forEach((reminder) => {
                this.scheduleReminder(reminder);
            });
        },
    }),
    {
        name: "reminder-store",
        version: 1,
    },
);
```

### 8.4 约定与规范

1. **权限检查**：使用通知前必须检查和请求权限
2. **降级处理**：Tauri 和 Web 环境使用不同的通知 API
3. **连接管理**：WebSocket/SSE 需实现自动重连机制
4. **资源清理**：组件卸载时关闭连接，清除定时器
5. **错误处理**：网络错误不应阻断应用主流程
6. **心跳机制**：长连接需实现心跳保活

### 8.5 示例参考

| 功能 | 实现要点 | 参考文件 |
|------|----------|----------|
| 版本更新通知 | 定时检查 + 系统通知 | `app/store/update.ts` |
| 流式响应 | SSE 解析 | `app/utils/stream.ts` |
| 实时聊天 | WebSocket 双向通信 | 需自行实现 |
| 日程提醒 | 定时器 + 系统通知 | 需自行实现 |

---

## 附录

### 附录 A：功能到领域的快速索引

根据你要开发的功能，快速找到需要阅读的章节：

| 功能需求 | 主要章节 | 辅助章节 |
|----------|----------|----------|
| **文件上传读取** | 第二章（消息流拦截） | 第六章（工具函数） |
| **MCP 工具支持** | 第五章（API 请求） | 第六章（类型系统）、第二章（消息注入） |
| **联网搜索** | 第二章（消息拦截） | 第五章（API 请求） |
| **Prompt 市场 TAB** | 第一章（路由扩展） | 第三章（状态管理） |
| **文档收藏 TAB** | 第一章（路由扩展） | 第三章（数据持久化） |
| **划词翻译工具** | 第一章（多窗口） | 第四章（系统事件）、第五章（API 请求） |
| **AI 电脑工具** | 第四章（全局快捷键） | 第七章（系统命令）、第五章（API 复用） |
| **AI 日程管家** | 第八章（推送通知） | 第三章（状态管理）、第五章（API 请求） |
| **Python 插件系统** | 第七章（Sidecar 子进程） | 第六章（JSON 协议） |
| **插件市场** | 第七章（Git 操作） | 第一章（路由扩展）、第三章（状态管理） |
| **新增 LLM Provider** | 第五章（API 与网络） | 第六章（类型系统） |
| **自定义 Rust 命令** | 第四章（Tauri 集成） | - |
| **新建 Zustand Store** | 第三章（状态管理） | - |
| **系统通知功能** | 第八章（推送通知） | 第四章（Tauri 集成） |

### 附录 B：关键文件路径速查表

#### 前端核心文件

| 文件路径 | 职责 | 常用修改点 |
|----------|------|------------|
| `app/constant.ts` | 常量定义 | Path、ApiPath、StoreKey、ModelProvider 枚举 |
| `app/components/home.tsx` | 主页面布局与路由 | Route 配置、动态导入 |
| `app/components/sidebar.tsx` | 侧边栏 | DISCOVERY 数组（入口配置） |
| `app/components/chat.tsx` | 聊天界面 | 消息输入、发送逻辑 |
| `app/store/chat.ts` | 聊天状态管理 | onUserInput()、getMessagesWithMemory() |
| `app/store/config.ts` | 全局配置 | 应用设置 |
| `app/store/access.ts` | API 密钥管理 | 认证相关 |
| `app/client/api.ts` | LLMApi 抽象 | Provider 注册、类型定义 |
| `app/client/platforms/*.ts` | Provider 实现 | 各平台 API 调用逻辑 |
| `app/utils/store.ts` | Store 工厂 | createPersistStore() |
| `app/utils/stream.ts` | 流式请求封装 | Tauri/Web 双模式 fetch |
| `app/typing.ts` | 类型定义 | 全局类型 |
| `app/global.d.ts` | 全局类型扩展 | Window.__TAURI__ |

#### API 路由文件

| 文件路径 | 职责 |
|----------|------|
| `app/api/[provider]/[...path]/route.ts` | 动态路由入口（分发到各 handler） |
| `app/api/openai.ts` | OpenAI 代理 |
| `app/api/anthropic.ts` | Anthropic 代理 |
| `app/api/google.ts` | Google Gemini 代理 |
| `app/api/config/route.ts` | 配置接口 |

#### Tauri 后端文件

| 文件路径 | 职责 |
|----------|------|
| `src-tauri/src/main.rs` | Tauri 入口，命令注册 |
| `src-tauri/src/stream.rs` | 流式请求命令 |
| `src-tauri/Cargo.toml` | Rust 依赖配置 |
| `src-tauri/tauri.conf.json` | Tauri 配置（窗口、权限、sidecar） |

#### 工具函数文件

| 文件路径 | 主要导出 |
|----------|----------|
| `app/utils/format.ts` | prettyObject() |
| `app/utils/chat.ts` | preProcessImageContent(), getMessageTextContent() |
| `app/utils/checkers.ts` | isVisionModel(), isDalle3(), isO1() |
| `app/utils/token.ts` | estimateTokenLength() |
| `app/utils/clone.ts` | deepClone() |
| `app/utils/merge.ts` | merge() |
| `app/utils/indexedDB-storage.ts` | indexedDBStorage |

### 附录 C：开发检查清单

#### 新增页面（TAB）检查清单

- [ ] 在 `app/constant.ts` 的 `Path` 枚举中添加路径
- [ ] 在 `app/components/` 下创建页面组件
- [ ] 在 `app/components/home.tsx` 中添加动态导入
- [ ] 在 `app/components/home.tsx` 的 Routes 中添加路由
- [ ] （可选）在 `app/components/sidebar.tsx` 的 DISCOVERY 中添加入口
- [ ] （可选）在 `app/locales/` 中添加国际化文本

#### 新增 LLM Provider 检查清单

- [ ] 在 `app/constant.ts` 中添加 BASE_URL、ApiPath、ModelProvider
- [ ] 在 `app/constant.ts` 的 DEFAULT_MODELS 中添加模型定义
- [ ] 在 `app/client/platforms/` 下创建 Provider 实现类
- [ ] 在 `app/client/api.ts` 的 ClientApi 构造函数中注册
- [ ] 在 `app/api/` 下创建代理 handler
- [ ] 在 `app/api/[provider]/[...path]/route.ts` 中添加路由分发
- [ ] 在 `.env.template` 中添加环境变量说明
- [ ] 在 `app/config/server.ts` 中添加服务端配置读取

#### 新增 Zustand Store 检查清单

- [ ] 在 `app/constant.ts` 的 `StoreKey` 枚举中添加键名
- [ ] 在 `app/store/` 下创建 Store 文件
- [ ] 使用 `createPersistStore()` 创建 Store
- [ ] 定义默认状态和方法
- [ ] 配置 `persistOptions`（name、version、migrate）
- [ ] 在组件中使用时检查 `_hasHydrated` 状态

#### 新增 Tauri 命令检查清单

- [ ] 在 `src-tauri/src/` 下创建 Rust 模块
- [ ] 使用 `#[tauri::command]` 宏定义命令
- [ ] 在 `src-tauri/src/main.rs` 中引入模块并注册命令
- [ ] 在 `src-tauri/tauri.conf.json` 的 `allowlist` 中配置权限
- [ ] 在 `app/global.d.ts` 中添加类型定义（可选）
- [ ] 在前端通过 `window.__TAURI__.invoke()` 调用

#### 消息拦截/注入检查清单

- [ ] 确定拦截点：onUserInput() 或 getMessagesWithMemory()
- [ ] 使用 try-catch 包装拦截逻辑
- [ ] 异步操作使用 await
- [ ] 确保不破坏原有消息流
- [ ] 测试各种边界情况

#### 系统通知检查清单

- [ ] 检查运行环境（Tauri vs Web）
- [ ] 调用 `isPermissionGranted()` 检查权限
- [ ] 调用 `requestPermission()` 请求权限
- [ ] 权限拒绝时提供降级方案
- [ ] 使用 `sendNotification()` 发送通知

---

## 文档版本

- **版本**：1.0
- **创建日期**：2024
- **适用 NextChat 版本**：2.16.x
- **维护者**：二次开发者社区

---

## 参考资源

- [NextChat GitHub 仓库](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)
- [Tauri 官方文档](https://tauri.app/v1/guides/)
- [Next.js 官方文档](https://nextjs.org/docs)
- [Zustand 官方文档](https://github.com/pmndrs/zustand)
- [项目 CLAUDE.md](../CLAUDE.md) - 项目架构详细说明

