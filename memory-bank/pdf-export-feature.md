# PDF Export Feature

This document describes the PDF export functionality implemented in Minstrel.

## Overview

Users can export their novel project (title page with cover art, followed by chapters) into a formatted PDF document. This allows for easy sharing, printing, or archiving of the work.

## User Interface

- **Trigger:** A floating toolbar appears at the bottom-center of the Novel Dashboard view when a project is active. This toolbar contains a single button with a "Download" icon (FileDown).
- **Configuration Modal:** Clicking the export button opens a modal dialog titled "PDF Export Options".
  - **Options:**
    - **Font:** A dropdown allows selecting the main font family for the PDF content. Initial options are Times New Roman, Helvetica/Arial, and Courier New.
    - **Paper Size:** A dropdown allows selecting the paper size. Initial options are A4, Letter, 6x9 inches, and 5.5x8.5 inches.
  - **Preview:** A large pane within the modal displays a live preview of the generated PDF using the currently selected options. This preview updates dynamically as options are changed.
  - **Actions:** "Export PDF" and "Cancel" buttons are available.
- **Export Process:**
  - Clicking "Export PDF" generates the PDF based on the selected configuration.
  - A loading indicator is shown on the toolbar button during generation.
  - Success or error messages are displayed using toasts.
  - On success, the browser triggers a download of the generated PDF file, named `[Project Title].pdf`.

## PDF Content & Formatting

- **Title Page:** The first page includes:
  - The project's cover image (if available), centered and scaled appropriately.
  - The project's title, centered below the image in a larger, bold font.
- **Chapters:**
  - Subsequent pages contain the content of the project's chapters.
  - Chapters are identified by `file.type === 'chapter'` and ordered according to `file.sort_order`.
  - Each chapter starts with its title, centered in a bold font.
  - Chapter content is rendered as plain text (Markdown formatting is stripped).
  - Text is justified.
- **Page Numbers:** Page numbers in the format "Current / Total" are displayed centered at the bottom of each page (excluding the title page).
- **Font & Paper Size:** The font family and paper size selected in the configuration modal are applied throughout the document.

## Technical Implementation

- **Library:** `@react-pdf/renderer` is used for PDF generation.
- **Components:**
  - `FloatingToolbar.tsx`: Displays the trigger button, manages loading state.
  - `PdfExportConfigModal.tsx`: Provides the configuration UI (using ShadCN Dialog, Select) and hosts the `<PDFViewer>`.
  - `pdfService.tsx`: Contains the core logic:
    - `ProjectPdfDocument`: React component defining the PDF structure using `@react-pdf/renderer` components (`<Document>`, `<Page>`, `<Text>`, `<Image>`, `<View>`). Accepts `project` and `config` props.
    - `generateProjectPdf`: Async function that takes project data and config, renders the `ProjectPdfDocument` to a blob.
    - `triggerDownload`: Helper function to initiate the file download from a blob.
- **Data Handling:**
  - The `ProjectFile` type includes `type` and `sort_order` properties.
  - `sqliteOps.ts` saves and loads these properties to/from the database.
  - `chatService.ts` infers `type` and assigns a default `sort_order` when processing AI responses containing files.
- **Styling:** Uses `StyleSheet.create` from `@react-pdf/renderer` and applies styles based on the selected configuration.
- **CSP:** The `index.html` Content Security Policy was updated to allow `connect-src data:` and `frame-src blob:` required by `@react-pdf/renderer` and its viewer.
