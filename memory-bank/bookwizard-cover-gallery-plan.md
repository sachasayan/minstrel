# BookWizard Cover Gallery – Feature Plan

## Objective

Enable users to select a cover image from a genre-filtered gallery during the BookWizard flow. User selection is required, limited strictly to provided gallery images. The chosen cover is embedded as base64 in the project data on creation.

---

## 1. Gallery Step Design

- Add a "Choose a Cover Image" step in the BookWizard flow after the genre/setting selection.
- Display only covers from `src/renderer/src/assets/book-covers.ts` relevant to the genre selected earlier.
- Use a thumbnail grid with selection highlight (no large preview needed).
- Thumbnails are shown in the order defined by the bookCovers array.
- The user cannot proceed without choosing a cover.

---

## 2. Selection and State

- Selection persists as the user navigates between steps (tracked in BookWizard state/context).
- Confirmation occurs within the gallery step only; do not display again on summary/confirmation.

---

## 3. Data Persistence

- On project creation, convert the chosen cover asset to base64 and embed in the new project data, matching existing uploaded cover handling.
- No uploading or custom image support: all images must be chosen from the gallery.

---

## 4. Accessibility & User Experience

- No additional accessibility requirements beyond standard browser visual interaction.
- No keyboard navigation, alt text, or ARIA roles required for now.

---

## 5. Implementation Steps

- Create `CoverStep.tsx` (gallery component).
- Insert gallery step in the BookWizard flow and wire to wizard state.
- Filter gallery images by selected genre.
- Enforce required selection before progressing.
- Persist selection as user navigates steps.
- On creation, fetch selected cover, encode to base64, and save to project.
- Do not show cover again on summary/confirmation step.

---

## Feature Constraints & Decisions

- **Gallery Only:** User cannot upload or select outside images.
- **Genre Filtered:** Covers shown are limited to the selected genre.
- **Selection Required:** Cannot proceed to summary/creation without selection.
- **No Preview:** No large preview: thumbnail grid only.
- **State Persistence:** Selection remains if user navigates backward.
- **Label:** Plan uses "Choose a Cover Image" as a straightforward title.

---

## End of Plan
