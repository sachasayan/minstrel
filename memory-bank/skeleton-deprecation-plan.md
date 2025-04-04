# Plan: Deprecate Skeleton File

This plan outlines the steps to remove the Skeleton generation step and file type from the Minstrel application workflow. The new flow will be Parameters -> Outline -> Chapters.

## 1. [COMPLETE] Update `outlineAgent` Prompt

*   **Goal:** Modify the prompt for the `outlineAgent` to remove references to the Skeleton and instruct it to generate the Outline directly from Project Parameters and user messages.
*   **Files:** `src/renderer/src/lib/prompts/outlineAgent.ts`
*   **Status:** COMPLETE

## 2. [COMPLETE] Update Outline Generation Trigger

*   **Goal:** Trigger the `outlineAgent` automatically after the initial project is created in the wizard.
*   **Files:** `src/renderer/src/components/BookWizard/SummaryPage.tsx`, `src/renderer/src/lib/services/chatService.ts`
*   **Action:** Renamed `generateSkeleton` to `generateOutlineFromParams` in `chatService.ts`. Updated `SummaryPage.tsx` to import and call `generateOutlineFromParams` in the `handleDream` function.
*   **Status:** COMPLETE

## 3. [COMPLETE] Remove Skeleton UI Element

*   **Goal:** Remove the "Skeleton" button/link from the sidebar.
*   **File:** `src/renderer/src/components/editor/AppSidebar.tsx`
*   **Action:** Removed the entry for "Skeleton" from the `structureItems` array. Updated `handleUniselect` to remove Skeleton check.
*   **Status:** COMPLETE

## 4. [COMPLETE] Update Database Save/Load Logic

*   **Goal:** Remove handling of the 'skeleton' type from save operations and actively delete existing 'skeleton' data during load.
*   **File:** `src/main/sqliteOps.ts`
*   **Action:**
    *   In `handleSaveSqliteProject`: Removed the code block that specifically inserts a file with type 'skeleton'.
    *   In `handleLoadSqliteProject`:
        *   Ensured the database is opened read-write.
        *   Added `db.exec("DELETE FROM files WHERE type = 'skeleton'");` after opening the DB and ensuring tables exist.
*   **Status:** COMPLETE

## 5. [COMPLETE] Update Memory Bank & Plan Docs

*   **Goal:** Reflect the removal of the Skeleton step in technical documentation and mark this plan complete.
*   **Files:** `memory-bank/techContext.md`, `memory-bank/projectBrief.md`, `memory-bank/skeleton-deprecation-plan.md`.
*   **Action:**
    *   Created `skeleton-deprecation-plan.md` with this plan. (Done)
    *   Updated `techContext.md` and `projectBrief.md` to remove references to the Skeleton step/file and adjust workflow descriptions. (Done)
    *   Updated `skeleton-deprecation-plan.md` to mark all steps as complete. (Done)
*   **Status:** COMPLETE
