# Minstrel System Patterns

## Architecture

Minstrel follows a client-server architecture, with a React/Vite/Electron frontend and a backend service that interacts with the Gemini API. The core components and their interactions are as follows:

- **Frontend (Renderer Process):**
  - **UI Components:** React components built using ShadCN UI. Handles user interaction, displays data, and dispatches actions to the Redux store. Key components include `AppSidebar`, `ChatInterface`, `MarkdownViewer`, `ProjectOverview`, `BookOutlineWizard`, and `Chart.tsx`.
  - **State Management:** Redux Toolkit manages the application state, including chat history (`chatSlice`), project data (`projectsSlice`), and application state (`appStateSlice`).
  - **Service Logic:** `chatManager.ts` handles communication with the Gemini API, prompt building, and response processing. `projectManager.ts` handles project loading, saving, and file system operations.
  - **Prompt Engineering:** `promptBuilder.ts` constructs prompts dynamically based on the current state and context. `prompts.ts` stores the static parts of the prompts.
- **Backend (Main Process):**
  - **`fileOps.ts`:** Handles file system operations (reading directories, reading files, writing files, creating directories) through Electron's IPC. This ensures proper path resolution and sandboxing.
  - **`llmService.ts`:** (In the renderer process, but conceptually part of the backend) Abstraction layer for interacting with the Gemini API.

## Component Relationships

- `AppSidebar` interacts with `projectManager` to save projects and with `chatSlice` and `appStateSlice` to manage UI state.
- `ChatInterface` interacts with `chatSlice` to display and manage chat history and with `chatManager` to send messages.
- `MarkdownViewer` displays Markdown content from the `projectSlice`.
- `BookOutlineWizard` collects initial project parameters and triggers the skeleton generation process.
- `ProjectOverview` combines `ChatInterface` and `MarkdownViewer` to provide the main project view.
- `chatManager` interacts with `llmService` to communicate with the Gemini API, `promptBuilder` to construct prompts, and `projectsSlice` to update project data.
- `projectManager` uses Electron's IPC to interact with `fileOps.ts` in the main process for file system operations.
