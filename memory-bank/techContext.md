# Minstrel Technical Context

## System Patterns

Minstrel follows a client-server architecture within an Electron application. The React/Vite frontend runs in the Renderer Process, while backend operations involving file system access and database management occur in the Main Process, communicated via Electron IPC.

- **Frontend (Renderer Process):**
  - **UI Components:** React components built using ShadCN UI. Handles user interaction, displays data, and dispatches actions to the Redux store. Key components include `AppSidebar`, `ChatInterface`, `MarkdownViewer`, `ProjectOverview`, `BookOutlineWizard`, `ProjectParameters`, and various UI elements from `src/renderer/src/components/ui/`. Key pages include `Intro.tsx`, `SettingsPage.tsx`, `ProjectOverview.tsx`.
    - `StatusBar`: A floating overlay component positioned fixed at the top of the page. Displays internet connectivity status, a theme toggle (light/dark), and a button to navigate to Settings. Initially implemented on the Intro page but designed to be reusable throughout the app.
  - **Book Outline Wizard Pages:** The `BookOutlineWizard` feature is split into multiple page components located in `src/renderer/src/components/BookWizard`: `Intro`, `StoryLength`, `SettingAndTitle`, `PlotPage`, `WritingSamplePage`, and `SummaryPage`.
  - **State Management:** Redux Toolkit manages the application state, including chat history (`chatSlice` - persistent), project data (`projectsSlice` - includes artwork data), application state (`appStateSlice` - includes `activeView`), and settings (`settingsSlice` - includes API key, project path, `highPreferenceModelId`, `lowPreferenceModelId`). Redux listeners (`src/renderer/src/lib/store/listeners/`) handle side effects like loading full project data. Selectors (e.g., `selectActiveProjectWithCoverDataUrl`) derive state like displayable cover image URLs.
  - **Service Logic:**
      - `fileService.ts`: Acts as the primary interface for project persistence. It determines the project format (`.md` or `.mns`) and routes calls to either legacy Markdown logic (for loading only) or `sqliteService.ts`. Handles automatic conversion from `.md` to `.mns` on save. Interacts with `fileOps.ts` and `sqliteOps.ts` via IPC. Constructs project fragments, including cover data URLs.
      - `sqliteService.ts`: Wraps IPC calls specifically for SQLite database operations defined in `sqliteOps.ts`.
      - `chatService.ts`: Handles communication with the LLM via `llmService`, prompt building, and response processing. Determines the `modelPreference` ('high' or 'low') based on the current agent and passes it to `llmService`. Triggers initial Outline generation via `generateOutlineFromParams`.
  - **Prompt Engineering:**
      - `promptBuilder.ts` constructs the final prompt string sent to the LLM. It uses a pure functional approach, importing `basePrompt` and utility functions (e.g., `addAvailableFiles`, `addUserPrompt`, `appendWithSeparator`) from `promptsUtils.ts`.
      - `promptsUtils.ts` defines the `basePrompt` and exports pure utility functions for adding specific context sections (like available files, user messages) to the prompt string. It handles consistent section separation.
      - Individual agent files (`routingAgent.ts`, `outlineAgent.ts`, `writerAgent.ts`, `criticAgent.ts`) and `tools.ts` export functions (`get<Name>Prompt`) that return their specific static prompt instructions as strings.
      - `promptBuilder.ts` combines the `basePrompt`, the relevant agent/tool prompt strings, and context-specific sections using the utility functions from `promptsUtils.ts`.
- **Backend (Main Process):**
  - **`fileOps.ts`:** Handles generic file system operations (reading directories, reading/writing/deleting files, making directories, selecting directories via `select-directory` IPC call) via Electron IPC handlers.
  - **`sqliteOps.ts`:** Handles all SQLite database interactions for project data (`.mns` files) via Electron IPC handlers (init, save, load meta, load full). Uses `better-sqlite3`.
  - **`settingsManager.ts`:** Handles loading and saving application settings (`apiKey`, `workingRootDirectory`, `highPreferenceModelId`, `lowPreferenceModelId`) via IPC, applying defaults if values are missing.
- **LLM Interaction:**
  - **`llmService.ts`:** (Renderer Process) Abstraction layer for interacting with the Gemini API via the Vercel AI SDK (`ai` package). Uses `createGoogleGenerativeAI` to configure the provider and `generateText` to make API calls. Reads the configured `highPreferenceModelId` and `lowPreferenceModelId` from the Redux settings state to select the appropriate model based on the `modelPreference` passed by `chatService`.

### Component Relationships

- `AppSidebar` interacts with `fileService` to save projects (triggering potential conversion and state updates) and uses Redux state (`projectsSlice`, `appStateSlice`, `chatSlice`) to manage UI state and data. It displays links for Parameters, Outline, and Chapters (Skeleton link removed).
- `ChatInterface` interacts with `chatSlice` to display/manage chat history and with `chatService` to send messages.
- `MarkdownViewer` displays Markdown content (Outline, Chapters) from the `projectsSlice`.
- `BookOutlineWizard` components manage the new project creation flow. `SummaryPage.tsx` now initiates project creation and triggers initial *Outline* generation via `chatService.ts`.
- `Intro` uses `fileService` (via `fetchProjects`) to list projects (displaying covers via `ProjectLibrary`) and triggers the full project load via Redux actions handled by listeners. It also provides an "Add New Project" option, which now dispatches a `startNewProject` action to create a placeholder empty project, sets `activeView` to `project/dashboard`, causing the app to immediately switch to the project view and display the wizard.
- `AppSidebar` contains an "Add Project" button which similarly dispatches `startNewProject` and switches the view, allowing creation of a new project from within any open project.
- `ProjectOverview` displays the current project's data. If the `activeProject` in Redux has the `isNew: true` flag set from either `Intro` or `AppSidebar`, it automatically opens the `BookOutlineWizard` modal.
- `ProjectParameters` allows editing metadata, including uploading cover artwork (via click or drag-drop), interacting with `projectsSlice`.
- `SettingsPage` renders the settings form UI (including API key input, model preference selects, project path selector button, and versions display). It interacts with `settingsSlice` to display current settings and dispatch updates. Uses `select-directory` IPC call via the button to choose the project path. Uses `save-app-settings` IPC call via the "Save Settings" button to persist changes. Includes a back button that dispatches `setActiveView('intro')`.
- `chatService` interacts with `llmService`, `promptBuilder`, and potentially updates Redux state (`chatSlice`, `projectsSlice`).
- `fileService` uses Electron IPC to interact with both `fileOps.ts` (for generic FS ops) and `sqliteOps.ts` (for project DB ops).

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

The project's dependencies are managed using `npm`. Key dependencies include `react`, `electron`, `@reduxjs/toolkit`, `better-sqlite3`, `ai`, `@ai-sdk/google`, and UI libraries like `@radix-ui/*` (via ShadCN). The full list can be found in `package.json`.

### Project Persistence

- **Format:** Projects are now primarily stored as single `.mns` files, which are SQLite databases. The legacy `.md` format is only supported for loading existing projects.
- **Conversion:** Existing `.md` projects are automatically converted to the `.mns` format upon the first save operation. The original `.md` file is deleted after successful conversion and saving.
- **Schema:** The SQLite database (`.mns` file) contains tables for:
    - `metadata`: Stores key-value pairs for project metadata (title, genre, summary, `coverImageBase64`, `coverImageMimeType`, etc.). Base64 data is stored as TEXT.
    - `files`: Stores the main content sections (**Outline**, **Chapters**) with columns like `title`, `content`, `type` (e.g., 'outline', 'chapter'), `sort_order`. The 'skeleton' type is deprecated and removed/ignored during save/load.
    - `chat_history`: Stores chat messages with columns like `id`, `timestamp`, `sender`, `text`, and `metadata` (JSON string).
- **Workflow:**
    1.  **Loading:** `fileService.ts` lists `.md` and `.mns` files. It calls `sqliteOps.ts` (`get-sqlite-project-meta`) via IPC to get metadata (including artwork base64/mime) for `.mns` files and constructs `ProjectFragment` objects, generating the `cover` data URL. When a project is selected, a Redux listener triggers `fileService.ts` (`fetchProjectDetails`), which routes to `sqliteOps.ts` (`load-sqlite-project`) to load the full data (metadata, files *excluding skeleton*, chat history, artwork base64/mime) from the `.mns` file. `load-sqlite-project` also deletes any residual `type='skeleton'` rows. The listener then populates `projectsSlice` and `chatSlice`.
    2.  **Saving:** `AppSidebar.tsx` triggers `fileService.ts` (`saveProject`), passing the current project state (including chat history and artwork base64/mime from `projectsSlice`). `saveProject` determines if conversion is needed. It calls `sqliteOps.ts` (`save-sqlite-project`) via `sqliteService.ts` to write all data (metadata including artwork, files *excluding skeleton*, chat history) to the `.mns` file within a transaction. If conversion occurred, it calls `fileOps.ts` (`delete-file`) via IPC to remove the old `.md` file. `AppSidebar.tsx` updates the Redux state (`projectPath`) if the path changed.
- **Backend Handlers:**
    - `sqliteOps.ts` (Main Process): Contains IPC handlers (`init-sqlite-project`, `save-sqlite-project`, `load-sqlite-project`, `get-sqlite-project-meta`) using `better-sqlite3`. Ensures tables exist on save/load. `save-sqlite-project` no longer saves 'skeleton' type. `load-sqlite-project` deletes 'skeleton' type rows.
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
