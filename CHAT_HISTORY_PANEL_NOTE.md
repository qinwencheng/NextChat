# NextChat Floating Chat Anchors Notes

## 1. Overview
The **Floating Chat Anchors** feature provides a draggable, collapsible sidebar for navigating long chat histories and managing favorite prompts. It replicates the utility of the "Gemini Pro Panel" userscript but fully integrated into the NextChat React architecture.

## 2. Final Architecture

### A. File Structure
```text
app/
├── store/
│   └── favorites.ts            # Global store for favorite prompts (Zustand + Persistence)
├── components/
│   ├── floating-chat-anchors/
│   │   ├── index.tsx           # Main Container (State, Drag/Resize, Boundary Logic)
│   │   ├── navigator.tsx       # "Directory" tab: Chat history list
│   │   ├── favorites.tsx       # "Favorites" tab: Saved prompts list
│   │   └── anchors.module.scss # Styles (Gemini-like aesthetic)
│   └── chat.tsx                # Integration point (Mounts component, provides boundary ref)
```

### B. State Management
*   **Favorites Store (`favorites.ts`)**:
    *   Uses `createPersistStore` to save data to IndexedDB (`StoreKey.Favorite`).
    *   Global state, accessible across different chat sessions.
    *   Actions: `addFavorite(text)`, `removeFavorite(text)`.
*   **Component State (`index.tsx`)**:
    *   `position`: `{x, y}` coordinates (Fixed positioning).
    *   `size`: `{width, height}` (Resizable).
    *   `isCollapsed`: Boolean for auto-hide/floating button mode.
    *   `activeTab`: Switch between 'navigator' and 'favorites'.

## 3. Integration Details

### Mounting in `chat.tsx`
The component is mounted *outside* the message list but *inside* the main chat layout to ensure proper layering. Crucially, it is rendered conditionally and constrained by a reference.

```tsx
// app/components/chat.tsx

// 1. Get reference to the scrollable body
const scrollRef = useRef<HTMLDivElement>(null);

// ... inside render ...
<div className={styles["chat-body"]} ref={scrollRef}> ... </div>

// 2. Mount component (hidden on mobile)
{!isMobileScreen && (
    <FloatingChatAnchors 
        messages={session.messages} 
        onInput={setUserInput} 
        containerRef={scrollRef} // Pass ref for boundary constraints
    />
)}
```

### Message Anchors
To enable scrolling, every chat message must have a unique ID that the `Navigator` can target.
```tsx
// app/components/chat.tsx
<div id={`msg-${message.id}`} ... >
```

## 4. Key Implementation Logic & "Lessons Learned"

### A. Boundary Constraints (The "Float Everywhere" Fix)
**Problem:** Initially, the panel could be dragged anywhere, including over the header or input box, or completely off-screen.
**Solution:**
1.  Pass `containerRef` (pointing to `.chat-body`) to the component.
2.  In `handleMouseMove`, calculate the container's bounding box using `getBoundingClientRect()`.
3.  Clamp the `newX` and `newY` values to ensure the *entire* panel stays within these bounds.

```typescript
// Clamp Logic
const bounds = containerRef.current.getBoundingClientRect();
const clampedX = Math.min(Math.max(newX, bounds.left), bounds.right - currentWidth);
const clampedY = Math.min(Math.max(newY, bounds.top), bounds.bottom - currentHeight);
```

### B. Expansion Overflow (The "Missing Content" Fix)
**Problem:** When the panel was snapped to the right edge (collapsed state), expanding it would push the content off-screen because the `x` coordinate remained fixed at the right edge.
**Solution:**
Implemented a smart `toggleCollapse` function. When expanding, it checks if `currentX + expandedWidth > containerRight`. If true, it shifts the `x` coordinate to the left to fit the expanded panel.

```typescript
if (newX + expandedWidth > bounds.right) {
    newX = Math.max(bounds.left, bounds.right - expandedWidth);
}
```

### C. Auto-Hide Sensitivity
**Problem:** Interacting with tabs or the header sometimes triggered `onMouseLeave`, causing the panel to collapse unexpectedly.
**Solution:**
1.  Use a `setTimeout` for the auto-hide trigger (`600ms`).
2.  Clear this timeout immediately on `onMouseEnter`.
3.  Add an `onClick` handler to the collapsed state as a failsafe to ensure it can always be re-opened, even if hover events are flaky (e.g., fast movement).

### D. UI/UX Polish (Gemini Aesthetic)
**Goal:** Match the clean, rounded look of the reference design.
**Implementation:**
*   **Colors:** Used `#f0f4f9` (Google's light surface color) for backgrounds and `#1a73e8` (Google Blue) for active states/text.
*   **Shapes:** Increased `border-radius` to `20px`/`24px` for a "pill" look on inputs and tabs.
*   **Collapsed State:** Transformed the panel into a circular floating button (48x48px) with a centered icon (`MenuIcon`) when collapsed.
*   **Shadows:** Applied `var(--shadow)` for depth.

### E. Styling Isolation
**Issue:** `Selector ":root" is not pure` error when importing global SCSS files into a module.
**Fix:** Removed `@import "../../styles/globals.scss"` from `anchors.module.scss`. CSS variables (`var(--white)`) work natively without import, provided they are defined globally in the application root.

## 5. Development Pitfalls (Tooling)
*   **Linting Crash:** The `eslint-plugin-unused-imports` rule crashed on `app/constant.ts` (likely due to it having exports but no imports).
*   **Workaround:** Added `app/constant.ts` to `.eslintignore`. Note: attempting to disable via inline comments failed because the plugin crashed before parsing the comment.

## 6. Development Guidelines
*   **Testing:** No need to run tests for this feature.
*   **Linting:** No need to run `yarn lint` for this feature.

## 7. Future Improvements
*   **Window Resize:** Currently, if the browser window is resized significantly, the fixed position might end up relative to the old viewport. Adding a `resize` listener to re-clamp positions would make it robust against window resizing.
*   **Mobile Support:** Currently hidden on mobile. Could implement a bottom-sheet version for mobile contexts.
