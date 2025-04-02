# Development Plan: SQLite Transition & `.md` Deprecation

This plan outlines the steps to modify the Minstrel application to automatically convert `.md` project files to the new `.mns` (SQLite) format upon saving, and delete the original `.md` file.

## 1. [COMPLETE] Add File Deletion IPC Handler

*   **Goal:** Create an IPC handler to delete a specified file.
*   **File:** `src/main/fileOps.ts`
*   **Action:**
    *   Create a new async function `handleDeleteFile(event, filePath)` that takes a file path, resolves it (handles `~`), and uses `fs.unlink(resolvedPath)` to delete the file. Include error handling (e.g., try-catch block, return `{ success: boolean, error?: string }`).
    *   Register this handler in `registerFileOpsHandlers` as `ipcMain.handle('delete-file', handleDeleteFile)`.
*   **Status:** COMPLETE

## 2. [COMPLETE] Modify `saveProject` for Conversion & Deletion

*   **Goal:** Update `saveProject` to always save as `.mns`, convert `.md` projects on save, delete the old `.md` file after conversion, and return the final saved path.
*   **File:** `src/renderer/src/lib/services/fileService.ts`
*   **Action:**
    *   Implement logic to check if the input `project.projectPath` ends in `.md`.
    *   **If `.md`:**
        *   Calculate the `.mns` path (`newPath = project.projectPath.replace(/\.md$/i, '.mns')`).
        *   Call `saveSqliteProject` with the project data and `newPath`.
        *   If `saveSqliteProject` is successful, call `window.electron.ipcRenderer.invoke('delete-file', originalMdPath)`. Log any deletion errors but don't necessarily fail the overall save if the `.mns` save succeeded.
        *   Return `{ success: true, finalPath: newPath }` if `saveSqliteProject` succeeded, otherwise `{ success: false, finalPath: null }`.
    *   **If `.mns`:**
        *   Call `saveSqliteProject` with the existing `project.projectPath`.
        *   Return `{ success: true, finalPath: project.projectPath }` if successful, otherwise `{ success: false, finalPath: null }`.
*   **Status:** COMPLETE

## 3. [COMPLETE] Update Save Trigger Logic

*   **Goal:** Update the code that calls `saveProject` (in `AppSidebar.tsx`) to handle the returned path and update Redux state if a conversion occurred.
*   **File:** `src/renderer/src/components/editor/AppSidebar.tsx`
*   **Action:**
    *   Modify the save handler function (likely triggered by a save button).
    *   Call the updated `saveProject(activeProject)`.
    *   On success (`result.success === true`):
        *   Dispatch `setAllFilesAsSaved()`.
        *   Get the current `projectPath` from the Redux store (`currentState.projects.activeProject.projectPath`).
        *   If `currentState.projects.activeProject.projectPath !== result.finalPath`, dispatch `updateMetaProperty({ property: 'projectPath', value: result.finalPath })`.
*   **Status:** COMPLETE

## Additional Fixes Implemented:

*   **`no such table: metadata` Error:** Updated `handleSaveSqliteProject` (`src/main/sqliteOps.ts`) to ensure database tables are created if they don't exist before saving.
*   **Metadata Loading Robustness:** Modified `handleGetSqliteProjectMeta` (`src/main/sqliteOps.ts`) to return `null` on error. Updated `sqliteService.ts` and `fileService.ts` to handle `null` return values gracefully when fetching project lists.
