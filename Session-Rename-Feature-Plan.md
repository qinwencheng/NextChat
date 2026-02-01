# 会话改名功能开发计划

## 1. 功能需求分析

### 1.1 核心功能

- 用户可以通过双击左侧会话列表中的会话名称来进入编辑模式
- 编辑模式下，会话名称变为可编辑的输入框
- 用户可以输入新的会话名称并按回车键保存
- 支持通过点击其他区域或按ESC键取消编辑

### 1.2 边界情况处理

- 输入为空时应保持原名称或使用默认名称
- 输入长度限制（防止过长的名称影响界面）
- 特殊字符处理（如换行符、HTML标签等）

## 2. 技术架构分析

### 2.1 前端组件结构

- **`app/components/chat-list.tsx`**:
  - `ChatItem` 组件:
    - 新增 `isEditing` 本地状态 (boolean).
    - 新增 `editValue` 本地状态 (string).
    - 双击标题 `div` 触发 `isEditing = true`.
    - 渲染 `<input>` 替代标题 `div` 当 `isEditing` 为真.
    - 处理 `onBlur` (取消/保存) 和 `onKeyDown` (Enter保存, Esc取消).
  - `ChatList` 组件:
    - 传递 `onEdit` 回调给 `ChatItem`.

### 2.2 状态管理

- **`app/store/chat.ts`**:
  - 新增 `updateSessionTopic(index: number, topic: string)` action.
  - 复用 `updateTargetSession` 逻辑来更新 `topic` 字段.

## 4. 详细实施步骤

### 4.1 第一步：研究现有代码 (已完成)
- 已分析 `app/store/chat.ts` 和 `app/components/chat-list.tsx`.
- 确定了修改点和样式参考 `app/components/home.module.scss`.

### 4.2 第二步：集成状态管理 (已完成)
- 修改 `app/store/chat.ts`，添加 `updateSessionTopic` 方法。
- 确保更新逻辑包含 `lastUpdate` 时间戳更新 (如果需要，或者仅更新标题).

### 4.3 第三步：修改 UI 组件 (已完成)
- 修改 `app/components/chat-list.tsx` 中的 `ChatItem` 组件.
  - 添加 `useState` 控制编辑状态.
  - 实现双击进入编辑模式.
  - 实现输入框渲染和事件处理.
- 修改 `ChatList` 组件，将 `updateSessionTopic` 绑定到 `ChatItem`.

### 4.4 第四步：样式调整 (已完成)
- 使用内联样式在 `app/components/chat-list.tsx` 中模拟了 input 的样式，复用了 `styles["chat-item-title"]` 类.

### 4.5 第五步：验证与优化
- [x] 代码实现已完成
- [ ] 验证双击重命名流程 (User Action)
- [ ] 验证数据持久化 (User Action)

## 6. 文件修改清单
- [x] `app/store/chat.ts`: 添加 `updateSessionTopic`.
- [x] `app/components/chat-list.tsx`: 实现编辑 UI 逻辑.
- [x] `app/components/home.module.scss`: (不需要修改，使用内联样式).