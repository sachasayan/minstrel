# Migration Plan: Move Cover Image Upload from Project Parameters to Dashboard

---

## Overview

Reorganize the UI and logic so the user manages the cover image **directly on the main Dashboard** rather than inside the Project Parameters page. Improves discoverability and user experience.

---

## Goals

- Extract **cover image upload, preview, drag & drop, validation, and Redux persistence** from `ProjectParameters.tsx`.
- Re-implement it as a **new Card** added at **top** of `NovelDashboard.tsx`.
- Fully REMOVE the old Cover UI from Parameters.
- Keep all existing cover editing features & validations intact.

---

## Migration Steps

### 1. Isolate existing functionality (ProjectParameters.tsx)

- **Constants**: image types/size:
  - `ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']`
  - `MAX_IMAGE_SIZE_MB = 5`
- **State Variables**:
  - `coverPreviewUrl: string|null`
  - `isDraggingOver: boolean`
- **Refs**:
  - `fileInputRef`, `dropZoneRef`
- **Redux Hooks**:
  - `dispatch`
  - Selectors `selectActiveProject` & `selectActiveProjectWithCoverDataUrl`
- **Handlers**:
  - `handleCoverButtonClick()`
  - `processImageFile()`
  - `handleFileChange()`
  - Drag/drop: `handleDragEnter/Leave/Over/Drop`
- **useEffect** to sync project state with preview URL.

---

### 2. Implement new Cover Card inside NovelDashboard.tsx

- Wrap logic and UI in a nested helper component, e.g.:

```tsx
function CoverCard() {
  // full UI + drag/drop/upload + redux save logic
}
```

- Add `CoverCard` **above the dashboard title**, inside Dashboard's top-level container:

```tsx
<div className="container ...">
  <Card>
    <CardHeader><CardTitle>Cover Image</CardTitle></CardHeader>
    <CardContent>
      {/* Cover uploader and preview */}
    </CardContent>
  </Card>

  <h1>Your Dashboard</h1>
  {...rest of dashboard...}
</div>
```

- UI features preserved:
  - Click-to-upload with file picker
  - Drag & drop support
  - Live preview with fallback genre cover
  - Validation & toast errors
  - Redux dispatch persists image data

---

### 3. Remove cover UI from ProjectParameters.tsx

- Delete **only** cover image JSX (roughly lines 242-280)
- Delete cover-related hooks, refs, state, constants, and functions.
- Keep rest of parameters UI fully intact: title, genre, year, etc.

---

### 4. Clean-up Redux hooks/imports

- Import `selectActiveProjectWithCoverDataUrl` and `updateCoverImage` into NovelDashboard if needed.
- Confirm dispatch/selector wiring is correct in Dashboard.
- Prune unused imports _only_ from ProjectParameters (after move).

---

### 5. Verify

- Cover edit works and persists as before.
- Drag/drop looks ok.
- File size/type validation enforced.
- Toasts display appropriate feedback.

---

## Diagram of New Structure

```mermaid
flowchart TD
  subgraph Before
    A[Project Parameters]
    A --> AC[Cover Upload & Preview]
    A --> AP[Other Settings]
    B[Dashboard]
  end

  Before --> After

  subgraph After
    B'[Dashboard]
    B' --> BC[Cover Upload (new Card)]
    B' --> BO[Outline, Charts, etc.]
    A'[Project Parameters]
    A' --> AP
  end
```

---

## Notes

- Consider abstracting CoverCard into its own separate file/component in future.
- Avoid UI regressions by copying Tailwind + shadcn/ui markup carefully.
- No Redux architecture changes needed.
- This change improves user workflow and UI clarity.

---
