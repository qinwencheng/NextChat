# Gemini Pro Panel Analysis

## 1. Overview
The **Gemini Pro Panel** is a floating utility sidebar originally developed as a Tampermonkey userscript for the Google Gemini web interface (`https://gemini.google.com/*`). 

**Key Features:**
*   **History Inspector**: Monitors DOM for `.query-text` elements to list user prompts for quick navigation.
*   **Prompt Favorites**: Persistent storage (LocalStorage) for frequently used prompts; injects text into the input box on click.
*   **Smart UI**: Floating, draggable, resizable, and auto-collapsing sidebar.
*   **Search**: Full-text search capability for both history and favorites.
*   **Auto-snapping**: "Magnetic" edge detection when dragging.

## 2. Architecture & Technical Details

### 2.1 Source Code
*   **Source File**: `gemini-pro-panel/gemini-panel.user.js`
*   **License**: MIT
*   **Version**: 1.0

### 2.2 Implementation Architecture
*   **DOM Manipulation**: Directly injects HTML strings (`sidebar`, `header`, `resizers`) into `document.body`.
*   **State Persistence**: Uses `localStorage` keys: `gemini-favorites`, `gemini-nav-config`, `gemini-auto-hide`.
*   **Reactivity**: Uses `MutationObserver` on `document.body` to detect new messages (`.query-text`) and refresh the list.
*   **Input Handling**: Finds input via `div[role="textbox"]`, `div[contenteditable="true"]`, or `textarea`, and uses `document.execCommand('insertText')` to simulate typing.
*   **Styling**: Injects a raw CSS string. Hardcoded colors (White/Gray) mean **no Dark Mode support**.
*   **Error Handling**: Minimal. Relies on `try-catch` blocks or silent failures if DOM elements are missing.

### 2.3 Core Functionality

#### A. History Inspector
*   Monitors DOM elements with class `.query-text` to extract user prompts
*   Displays all user prompts from the current session for quick navigation
*   Uses MutationObserver to detect new messages and update the list
*   Allows clicking on history items to scroll to that part of the conversation

#### B. Prompt Favorites
*   Stores frequently used prompts in browser localStorage as `gemini-favorites`
*   Allows adding prompts to favorites by clicking the star icon next to history items
*   Enables one-click insertion of favorite prompts into the input field
*   Provides ability to remove favorites

#### C. Smart UI Features
*   Floating sidebar that can be positioned anywhere on screen
*   Draggable interface with smooth transitions
*   Resizable panel with minimum size constraints
*   Auto-collapse feature when mouse leaves the panel
*   Magnetic snapping to screen edges when dragged near them
*   Lock feature to disable auto-hiding

#### D. Search Functionality
*   Real-time filtering of both history and favorites lists
*   Case-insensitive text matching
*   Applied to whichever tab is currently active

### 2.4 User Interface Elements
*   Collapsible sidebar with rounded corners (24px radius)
*   Two-tab interface: "目录" (Contents/History) and "收藏" (Favorites)
*   Header with lock button to toggle auto-hide behavior
*   Search input field at the top of the panel
*   Scrollable content area for history and favorites
*   Action buttons (star for favorites, trash for deletion) on hover

### 2.5 Storage Schema
*   `gemini-favorites`: JSON array of saved prompt strings
*   `gemini-nav-config`: Object containing panel position (left, top) and dimensions (width, height)
*   `gemini-auto-hide`: Boolean flag indicating whether auto-hide is enabled

### 2.6 Technical Constraints
*   Runs only on `https://gemini.google.com/*` domain
*   Requires Tampermonkey browser extension
*   Uses DOM manipulation which may break if Gemini's UI changes significantly
*   Depends on specific class names like `.query-text` to identify content