# Plan: Chat Persistence

This plan outlines the steps to implement chat history persistence within the project's `.mns` (SQLite) file.

## 1. [UNFINISHED] Update `Project` Type

*   **Goal:** Add an optional `chatHistory` field to the main `Project` type definition.
*   **File:** `src/renderer/src/types.ts`
*   **Action:** Add `chatHistory?: ChatMessage[]` to the `Project` interface. Define `ChatMessage` if not already present, ensuring it includes `sender`, `text`, and optional `timestamp` and `metadata`.
*   **Status:** UNFINISHED

## 2. [UNFINISHED] Update Database Schema

*   **Goal:** Add a `chat_history` table to the SQLite schema with core fields and a flexible metadata column.
*   **File:** `src/main/sqliteOps.ts`
*   **Action:** Modify the `CREATE_TABLES_SQL` constant to include:
    ```sql
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      metadata TEXT -- Store additional JSON data here
    );
    ```
*   **Status:** UNFINISHED

## 3. [UNFINISHED] Update Save Logic (Backend - `sqliteOps.ts`)

*   **Goal:** Save the chat history array into the `chat_history` table within a transaction.
*   **File:** `src/main/sqliteOps.ts`
*   **Action:** In `handleSaveSqliteProject`:
    *   Wrap metadata, file, and chat history saving logic in a `BEGIN`/`COMMIT`/`ROLLBACK` transaction.
    *   Check if `project.chatHistory` exists and is an array.
    *   If yes:
        *   `db.exec('DELETE FROM chat_history');`
        *   Prepare `INSERT INTO chat_history (sender, text, timestamp, metadata) VALUES (?, ?, ?, ?)`.
        *   Iterate through `project.chatHistory` and run the insert statement for each message (handle `metadata` stringification, use message `timestamp` if available).
*   **Status:** UNFINISHED

## 4. [UNFINISHED] Update Load Logic (Backend - `sqliteOps.ts`)

*   **Goal:** Retrieve the chat history when loading a full project.
*   **File:** `src/main/sqliteOps.ts`
*   **Action:** In `handleLoadSqliteProject`:
    *   After retrieving metadata and files, add a query: `const chatHistory = db.prepare('SELECT id, sender, text, timestamp, metadata FROM chat_history ORDER BY timestamp ASC, id ASC').all();`
    *   Parse the `metadata` JSON string for each row.
    *   Add the resulting `chatHistory` array (or an empty array if none found) to the returned project object.
*   **Status:** UNFINISHED

## 5. [UNFINISHED] Update Save Trigger (Frontend Component - `AppSidebar.tsx`)

*   **Goal:** Include the current chat history from Redux when triggering a save.
*   **File:** `src/renderer/src/components/editor/AppSidebar.tsx`
*   **Action:** In `handleSave`:
    *   Import `selectChatHistory` from `chatSlice`.
    *   Use `useSelector(selectChatHistory)` to get the current history.
    *   Create the project object to save: `const projectToSave = { ...projectsState.activeProject, chatHistory: currentChatHistory };`
    *   Pass `projectToSave` to the `saveProject` function call.
*   **Status:** UNFINISHED

## 6. [UNFINISHED] Update Load Logic (Frontend Listener/Slice)

*   **Goal:** Populate the `chatSlice` with the loaded history.
*   **Files:** `src/renderer/src/lib/store/chatSlice.ts`, `src/renderer/src/lib/store/listeners/projectListeners.ts`
*   **Action:**
    *   In `chatSlice.ts`: Add a new reducer `setChatHistory(state, action: PayloadAction<ChatMessage[]>)` that replaces `state.chatHistory` with `action.payload`. Export the action. Add `selectChatHistory` selector. Ensure `ChatMessage` type matches `types.ts`.
    *   In `projectListeners.ts`: Modify the listener for `setActiveProjectFromFragment`. After fetching the `fullProject` and dispatching `setActiveProject(fullProject)`, check if `fullProject.chatHistory` exists and dispatch `setChatHistory(fullProject.chatHistory ?? [])`. Ensure action types are correctly handled.
*   **Status:** UNFINISHED

## 7. [UNFINISHED] Create Plan Documentation

*   **Goal:** Save this plan for reference.
*   **File:** `memory-bank/chat-persistence-plan.md`
*   **Action:** Use `write_to_file` to save the plan details.
*   **Status:** UNFINISHED
