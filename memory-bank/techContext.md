# Minstrel Technical Context

## System Patterns

Minstrel follows a client-server architecture within an Electron application. The React/Vite frontend runs in the Renderer Process, while backend operations involving file system access and database management occur in the Main Process, communicated via Electron IPC.

- **Frontend (Renderer Process):**
  - **UI Components:** React components built using ShadCN UI. Handles user interaction, displays data, and dispatches actions to the Redux store. Key components include `AppSidebar`, `ChatInterface`, `MarkdownViewer`, `ProjectOverview`, `BookOutlineWizard`, `ProjectParameters`, `CoverStep`, `NovelDashboard`, `FloatingToolbar.tsx`, `PdfExportConfigModal.tsx`, and various UI elements from `src/renderer/src/components/ui/`. Key pages include `Intro.tsx` (main app intro/library), `SettingsPage.tsx`, `ProjectOverview.tsx`, `OnboardingPage.tsx`. Onboarding steps are in `src/renderer/src/components/OnboardingSteps/`.
    - `StatusBar`: A floating overlay component positioned fixed at the top of the page. Displays internet connectivity status, a theme toggle (light/dark), and a button to navigate to Settings. Initially implemented on the Intro page but designed to be reusable throughout the app.
    - `FloatingToolbar`: A floating toolbar centered at the bottom of views like the Novel Dashboard, containing action buttons like "Export PDF".
    - `PdfExportConfigModal`: A dialog modal triggered from the `FloatingToolbar` allowing users to configure PDF export options (font, paper size) and view a live preview.
  - **Book Outline Wizard Pages:** The `BookOutlineWizard` feature (`src/renderer/src/pages/BookOutlineWizard.tsx`) renders step components from `src/renderer/src/components/BookWizard/`: `Intro`, `StoryLengthStep`, `GenreStep`, `SettingStep`, `CoverStep`, `PlotPage`, `TitleStep`, and `SummaryPage`. (Note: Plot and Title steps were swapped).
  - **State Management:** Redux Toolkit manages the application state, including chat history (`chatSlice` - persistent), project data (`projectsSlice` - includes artwork data, `ProjectFile` now includes optional `type` and `sort_order`), application state (`appStateSlice` - includes `activeView`), and settings (`settingsSlice` - includes API key, project path, `highPreferenceModelId`, `lowPreferenceModelId`). Redux listeners (`src/renderer/src/lib/store/listeners/`) handle side effects like loading full project data. Selectors (e.g., `selectActiveProjectWithCoverDataUrl`) derive state like displayable cover image URLs. The `updateFile` reducer in `projectsSlice` now handles saving `type` and `sort_order` when adding new files.
  - **Service Logic:**
    - `fileService.ts`: Acts as the primary interface for project persistence. It determines the project format (`.md` or `.mns`) and routes calls to either legacy Markdown logic (for loading only) or `sqliteService.ts`. Handles automatic conversion from `.md` to `.mns` on save. Interacts with `fileOps.ts` and `sqliteOps.ts` via IPC. Constructs project fragments, including cover data URLs.
    - `sqliteService.ts`: Wraps IPC calls specifically for SQLite database operations defined in `sqliteOps.ts`.
    - `chatService.ts`: Handles communication with the LLM via `llmService`, prompt building, and response processing. Determines the `modelPreference` ('high' or 'low') based on the current agent and passes it to `llmService`. Triggers initial Outline generation via `generateOutlineFromParams` and title suggestions via `generateTitleSuggestions`. Infers `type` (e.g., 'outline', 'chapter') and assigns a default `sort_order` when processing `<write_file>` tags from AI responses before dispatching `updateFile`.
    - `pdfService.tsx`: Handles the generation of PDF documents using `@react-pdf/renderer`. Defines the PDF structure (`ProjectPdfDocument`) and provides functions to generate and trigger downloads.
  - **Prompt Engineering:**
    - `promptBuilder.ts` constructs the final prompt string sent to the LLM. It uses a pure functional approach, importing `basePrompt` and utility functions (e.g., `addAvailableFiles`, `addUserPrompt`, `appendWithSeparator`) from `promptsUtils.ts`.
    - `promptsUtils.ts` defines the `basePrompt` and exports pure utility functions for adding specific context sections (like available files, user messages) to the prompt string. It handles consistent section separation.
    - Individual agent files (`routingAgent.ts`, `outlineAgent.ts`, `writerAgent.ts`, `criticAgent.ts`) and `tools.ts` export functions (`get<Name>Prompt`) that return their specific static prompt instructions as strings.
    - `promptBuilder.ts` combines the `basePrompt`, the relevant agent/tool prompt strings, and context-specific sections using the utility functions from `promptsUtils.ts`.
- **Backend (Main Process):**
  - **`fileOps.ts`:** Handles generic file system operations (reading directories, reading/writing/deleting files, making directories, selecting directories via `select-directory` IPC call) via Electron IPC handlers.
  - **`sqliteOps.ts`:** Handles all SQLite database interactions for project data (`.mns` files) via Electron IPC handlers (init, save, load meta, load full). Uses `better-sqlite3`. Saves and loads `type` and `sort_order` for the `files` table.
  - **`settingsManager.ts`:** Handles loading and saving application settings (`apiKey`, `workingRootDirectory`, `highPreferenceModelId`, `lowPreferenceModelId`) via IPC, applying defaults if values are missing.
- **LLM Interaction:**
  - **`llmService.ts`:** (Renderer Process) Abstraction layer for interacting with the Gemini API via the Vercel AI SDK (`ai` package). Uses `createGoogleGenerativeAI` to configure the provider and `generateText` to make API calls. Reads the configured `highPreferenceModelId` and `lowPreferenceModelId` from the Redux settings state to select the appropriate model based on the `modelPreference` passed by `chatService`.
- **Content Security Policy (CSP):**
  - Defined via a `<meta>` tag in `src/renderer/index.html`.
  - Updated to include `data:` in `connect-src` and `blob:` in `frame-src` to support `@react-pdf/renderer` and its preview viewer.

### Component Relationships

- `App.tsx`: Main application component. Loads settings via IPC on mount. Conditionally renders either `OnboardingPage.tsx` (if settings like `apiKey` or `workingRootDirectory` are missing) or the main application view determined by the `router` function based on `appStateSlice.activeView`.
- `AppSidebar` interacts with `fileService` to save projects (triggering potential conversion and state updates) and uses Redux state (`projectsSlice`, `appStateSlice`, `chatSlice`) to manage UI state and data. It displays links for Parameters, Outline, and Chapters (Skeleton link removed).
- `ChatInterface` interacts with `chatSlice` to display/manage chat history and with `chatService` to send messages.
- `MarkdownViewer` displays Markdown content (Outline, Chapters) from the `projectsSlice`.
- `BookOutlineWizard.tsx` (Page Component): Manages the multi-step wizard flow (Steps 0-8). Uses `WizardContext` to share state (`formData`, `currentStep`, `selectedCoverPath`, setters, `requestScrollToBottom`) between steps. Conditionally renders the `ParameterChecklist` sidebar (hides for Step 0 - Intro). Renders the current and previous step components using `.map`, applying Framer Motion animations with a delay for step appearance. Handles back button navigation (always returns to 'intro' view). Passes necessary state and setters to child step components.
- `Intro.tsx` (Wizard Step 0): No longer a standalone page. Restyled to match the chat bubble format (icon + bubble). Presents initial options: "Help me!" (uses `cheatData` including `coverPath`, calls `setSelectedCoverPath`, sets `currentStep` to 8) or "I've got a story idea..." (sets `currentStep` to 1). Buttons are now inside the chat bubble.
- `AppSidebar` contains an "Add Project" button which similarly dispatches `startNewProject` and switches the view, allowing creation of a new project from within any open project.
- `ProjectOverview` displays the current project's data. If the `activeProject` in Redux has the `isNew: true` flag set from either `Intro` or `AppSidebar`, it automatically opens the `BookOutlineWizard` modal.
- `ProjectParameters` allows editing metadata, including uploading cover artwork (via click or drag-drop), interacting with `projectsSlice`.
- `SettingsPage` renders the settings form UI (including API key input, model preference selects, project path selector button, and versions display). It interacts with `settingsSlice` to display current settings and dispatch updates. Uses `select-directory` IPC call via the button to choose the project path. Uses `save-app-settings` IPC call via the "Save Settings" button to persist changes. Includes a back button that dispatches `setActiveView('intro')`.
- `chatService` interacts with `llmService`, `promptBuilder`, and potentially updates Redux state (`chatSlice`, `projectsSlice`). Dispatches `updateFile` actions including `type` and `sort_order`.
- `fileService` uses Electron IPC to interact with both `fileOps.ts` (for generic FS ops) and `sqliteOps.ts` (for project DB ops).
- `CoverStep.tsx` (Wizard Step 4): Displays a gallery of cover images (`src/renderer/public/covers/`) filtered by the selected genre (`selectedGenre` prop from context via parent). Allows user selection, updating parent state via `setSelectedCoverPath` prop. Requires selection before proceeding (`handleProceed` prop). Shows a summary thumbnail when inactive. Filters based on `categoryName` in `book-covers.ts`.
- `PlotStep.tsx` (Wizard Step 5): Captures the basic plot summary from the user via a textarea, storing it in `formData.plot`.
- `TitleStep.tsx` (Wizard Step 6): When active, calls `chatService.generateTitleSuggestions` using the plot, genre, and setting from `formData`. Displays ~12 AI-generated suggestions in a responsive grid of clickable buttons. Clicking a suggestion populates the input field. Also allows the user to enter a custom title directly into the input field. Shows loading/error states.
- `SummaryPage.tsx` (Wizard Step 8): Retrieves `selectedCoverPath` from context. Includes logic (`convertImageToBase64`) to fetch the selected cover asset and convert it to Base64 before initiating project creation via `handleDream`. Uses `requestScrollToBottom` from context to trigger scrolling during outline text streaming. Also triggers initial _Outline_ generation via `chatService.ts`.
- `OnboardingPage.tsx`: Full-page component for the mandatory onboarding flow. Uses a two-column layout (left sidebar with `<Torrent />` visual, right main area for steps). Manages onboarding state (`currentStep`, `formData`) via `OnboardingContext`. Renders steps (`OnboardingIntroStep`, `OnboardingApiKeyStep`, `OnboardingSummaryStep`) sequentially using Framer Motion animations. Has no header or back/close navigation.
- `OnboardingIntroStep.tsx`: First step (Step 0) of onboarding. Uses chat bubble format. Prompts user for project directory selection (choose or use default). Uses `OnboardingContext` to update `formData` and advance to Step 1.
- `OnboardingApiKeyStep.tsx`: Second step (Step 1) of onboarding. Uses chat bubble format. Prompts user for Google AI API key, provides link, validates key via `geminiService.verifyKey` with debounce. Uses `OnboardingContext` to update `formData` and advance to Step 2 on success. Retains specific styling for "Get API Key" button.
- `OnboardingSummaryStep.tsx`: Final step (Step 2) of onboarding. Uses chat bubble format. Confirms readiness and saves collected settings (`workingRootDirectory`, `apiKey`) to Redux state (`settingsSlice`) and persistently via IPC (`save-app-settings`) when "I'm ready!" button is clicked. Completion implicitly allows `App.tsx` to render the main view on next load/refresh.
- `NovelDashboard.tsx`: Displays project overview, charts, and renders the `FloatingToolbar`.
- `FloatingToolbar.tsx`: Renders the "Export PDF" button, which triggers the `PdfExportConfigModal`. Handles the export process after configuration.
- `PdfExportConfigModal.tsx`: Dialog component allowing users to select font and paper size, view a PDF preview using `<PDFViewer>`, and confirm export.

---

## Tech Context

### Technologies Used

- **Frontend:**
  - **React:** JavaScript library for building user interfaces.
  - **Vite:** Fast build tool and development server.
  - **TailwindCSS:** Utility-first CSS framework.
  - **Electron:** Framework for building cross-platform desktop applications with web technologies.
  - **ShadCN UI:** UI component library.
  - **Lucide React:** Icon library.
  - **Recharts:** Charting library.
  - **MDXEditor:** Markdown editor component.
  - **Remark:** Markdown processor used for parsing outlines (`dashboardUtils.ts`). Includes `unist-util-visit` and `mdast-util-to-string` for AST traversal and text extraction.
  - **`@react-pdf/renderer`:** Library for generating PDF documents using React components.
- **State Management:**
  - **Redux Toolkit:** Library for managing application state, including listener middleware for side effects.
- **Communication:**
  - **Electron IPC:** Inter-process communication between the main and renderer processes for file system operations, SQLite database operations, and settings management.
  - **Vercel AI SDK (`ai`, `@ai-sdk/google`):** Used in the renderer process (`llmService`) to interact with the Google Gemini API.
- **Backend (Main Process):**
  - **Node.js:** JavaScript runtime environment.
  - **`better-sqlite3`:** Library for SQLite database interactions.
  - **`fs/promises`:** Node.js file system module (promises version).
- **Other:**
  - **TypeScript:** Superset of JavaScript that adds static typing.
  - **XMLParser:** Used for parsing XML responses from the Gemini API.
  - **tailwindcss-animate:** Tailwind plugin for animations.

### Dependencies

The project's dependencies are managed using `npm`. Key dependencies include `react`, `electron`, `@reduxjs/toolkit`, `better-sqlite3`, `ai`, `@ai-sdk/google`, `@react-pdf/renderer`, `remark`, `unist-util-visit`, `mdast-util-to-string`, and UI libraries like `@radix-ui/*` (via ShadCN). The full list can be found in `package.json`.

### Project Persistence

- **Format:** Projects are now primarily stored as single `.mns` files, which are SQLite databases. The legacy `.md` format is only supported for loading existing projects.
- **Conversion:** Existing `.md` projects are automatically converted to the `.mns` format upon the first save operation. The original `.md` file is deleted after successful conversion and saving.
- **Schema:** The SQLite database (`.mns` file) contains tables for:
  - `metadata`: Stores key-value pairs for project metadata (title, genre, summary, `coverImageBase64`, `coverImageMimeType`, etc.). Base64 data is stored as TEXT.
  - `files`: Stores the main content sections (**Outline**, **Chapters**) with columns like `title`, `content`, `type` (e.g., 'outline', 'chapter'), `sort_order` (integer for ordering). The 'skeleton' type is deprecated and removed/ignored during save/load.
  - `chat_history`: Stores chat messages with columns like `id`, `timestamp`, `sender`, `text`, and `metadata` (JSON string).
- **Workflow:**
  1.  **Loading:** `fileService.ts` lists `.md` and `.mns` files. It calls `sqliteOps.ts` (`get-sqlite-project-meta`) via IPC to get metadata (including artwork base64/mime) for `.mns` files and constructs `ProjectFragment` objects, generating the `cover` data URL. When a project is selected, a Redux listener triggers `fileService.ts` (`fetchProjectDetails`), which routes to `sqliteOps.ts` (`load-sqlite-project`) to load the full data (metadata, files including `type` and `sort_order`, chat history, artwork base64/mime) from the `.mns` file. `load-sqlite-project` also deletes any residual `type='skeleton'` rows and orders files by `sort_order`. The listener then populates `projectsSlice` (mapping loaded data to `ProjectFile` including `type`/`sort_order`) and `chatSlice`.
  2.  **Saving:** `AppSidebar.tsx` triggers `fileService.ts` (`saveProject`), passing the current project state (including chat history and artwork base64/mime from `projectsSlice`). `saveProject` determines if conversion is needed. It calls `sqliteOps.ts` (`save-sqlite-project`) via `sqliteService.ts` to write all data (metadata including artwork, files including `type` and `sort_order`, chat history) to the `.mns` file within a transaction. If conversion occurred, it calls `fileOps.ts` (`delete-file`) via IPC to remove the old `.md` file. `AppSidebar.tsx` updates the Redux state (`projectPath`) if the path changed.
- **Backend Handlers:**
  - `sqliteOps.ts` (Main Process): Contains IPC handlers (`init-sqlite-project`, `save-sqlite-project`, `load-sqlite-project`, `get-sqlite-project-meta`) using `better-sqlite3`. Ensures tables exist on save/load. `save-sqlite-project` now saves `type` and `sort_order` from the provided file objects. `load-sqlite-project` retrieves `type` and `sort_order` and orders by `sort_order`.
  - `fileOps.ts` (Main Process): Contains IPC handlers for generic file operations (`read-directory`, `delete-file`, `select-directory`, etc.) using `fs/promises`.

### Artwork Handling

(This section remains unchanged)

- **Storage:** Cover artwork is stored as a base64 encoded string (`coverImageBase64`) and its corresponding mime type (`coverImageMimeType`) within the `metadata` table of the project's `.mns` file.
- **Upload:** Users can upload an image via button click or drag-and-drop in `ProjectParameters.tsx`.
- **Validation:** Client-side validation in `ProjectParameters.tsx` restricts uploads to specific image types (JPEG, PNG, WebP) and a maximum size (e.g., 5MB).
- **Processing:** `FileReader.readAsDataURL` is used to get the image data. Base64 content and mime type are extracted.
- **State Update:** The `updateCoverImage` action in `projectsSlice.ts` updates the `coverImageBase64` and `coverImageMimeType` in the Redux store.
- **Display:**
  - A selector (`selectActiveProjectWithCoverDataUrl` in `projectsSlice.ts`) generates a `data:` URL from the stored base64/mime type for the active project.
  - For the project library, `getProjectFragmentMeta` in `fileService.ts` generates the `data:` URL when loading fragments.
  - UI components (`ProjectParameters.tsx`, `ProjectLibrary.tsx`) use the generated `data:` URL (stored in the `cover` property) for display, with fallbacks to genre-based images.

### Multi-Agent Architecture

(This section remains unchanged)

The project uses a multi-agent architecture with a routing agent delegating tasks to specialized agents (criticAgent, outlineAgent, writerAgent).

    - **Routing Agent:** Responsible for initial request handling and agent delegation. Its prompt logic is defined in `routingAgent.ts` (`getRoutingAgentPrompt`) and assembled by `promptBuilder.ts`. Used by default in `chatService.ts`. Uses the 'low' preference model.
    - **Specialized Agents:** `criticAgent`, `outlineAgent`, `writerAgent` are designed for specific tasks. Prompts for these agents are defined in individual files (e.g., `outlineAgent.ts` exporting `getOutlineAgentPrompt`). The `outlineAgent` now generates the initial outline directly from parameters. `outlineAgent` and `writerAgent` use the 'high' preference model. `criticAgent` uses the 'low' preference model.
    - **Agent Switching:** `chatService.ts` processes the `<route_to>` tag in the model's response to switch agents dynamically.
    - **Context Handling:** `promptBuilder.ts` constructs prompts using pure functions from `promptsUtils.ts` to add relevant context for each agent, including user messages, available project data sections (Outline, Chapters), and their content (sourced from Redux via helper functions within `promptBuilder.ts`). `chatService.ts` determines the appropriate `modelPreference` ('high' or 'low') to pass to `llmService`.

### PDF Export

- **Functionality:** Allows exporting the current project (Title Page with Cover, Chapters) to a PDF file.
- **Trigger:** A floating toolbar (`FloatingToolbar.tsx`) centered at the bottom of the `NovelDashboard.tsx` contains the export button.
- **Configuration:** Clicking the export button opens a modal (`PdfExportConfigModal.tsx`) where the user can select:
  - Font Family (Times New Roman, Helvetica, Courier New initially).
  - Paper Size (A4, Letter, 6x9 inches, 5.5x8.5 inches initially).
- **Preview:** The modal includes a live preview pane using `<PDFViewer>` from `@react-pdf/renderer`, showing how the document will look with the selected options.
- **Generation:** Uses `@react-pdf/renderer` library via `pdfService.tsx`.
  - `ProjectPdfDocument`: React component defining the PDF structure.
  - Renders title page (cover + title) and subsequent pages for each chapter (title + plain text content).
  - Applies selected font and paper size.
  - Includes page numbers ("X / Y") on chapter pages.
- **Output:** Generates a downloadable PDF file named `[Project Title].pdf`.

### Do not read files named

(This section remains unchanged).

- criticAgent.ts
- outlineAgent.ts
- promptsUtils.ts
- routingAgent.ts
- writerAgent.ts

### Testing

(This section remains unchanged)

Mock projects for testing are located in the `mock-projects` folder. The available mock projects are now in the `.mns` format:

- Romance Island.mns
- Science Station 2.mns
- Western 3.mns
