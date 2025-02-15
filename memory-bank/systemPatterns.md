# Minstrel System Patterns

## Architecture

Minstrel follows a client-server architecture, with a React/Vite/Electron frontend and a backend service that interacts with the Gemini API. The core components and their interactions are as follows:

*   **Frontend (Renderer Process):**
    *   **UI Components:**  React components built using ShadCN UI.  Handles user interaction, displays data, and dispatches actions to the Redux store. Key components include `AppSidebar`, `ChatInterface`, `MarkdownViewer`, `ProjectOverview`, `BookOutlineWizard`, and `Chart.tsx`.
    *   **State Management:** Redux Toolkit manages the application state, including chat history (`chatSlice`), project data (`projectsSlice`), and application state (`appStateSlice`).
    *   **Service Logic:**  `chatManager.ts` handles communication with the Gemini API, prompt building, and response processing. `projectManager.ts` handles project loading, saving, and file system operations.
    *   **Prompt Engineering:** `promptBuilder.ts` constructs prompts dynamically based on the current state and context. `prompts.ts` stores the static parts of the prompts.
*   **Backend (Main Process):**
    *   **`fileOps.ts`:**  Handles file system operations (reading directories, reading files, writing files, creating directories) through Electron's IPC. This ensures proper path resolution and sandboxing.
    *   **`GeminiService.ts`:** (In the renderer process, but conceptually part of the backend) Abstraction layer for interacting with the Gemini API.

## Key Design Patterns

*   **Model-View-Controller (MVC) / Model-View-ViewModel (MVVM):** The frontend loosely follows an MVC/MVVM pattern.  React components act as the View, the Redux store acts as the Model, and the service logic (e.g., `chatManager.ts`, `projectManager.ts`) acts as the Controller/ViewModel.
*   **Component-Based UI:** The frontend is built using reusable React components, promoting modularity and maintainability.
*   **Asynchronous Communication:**  Communication between the frontend and backend (and with the Gemini API) is asynchronous, using Promises and `async/await`.
*   **Event-Driven Architecture:**  Electron's IPC is used for communication between the main and renderer processes, following an event-driven pattern.
*   **Redux for State Management:**  Redux Toolkit provides a predictable state container, making it easier to manage the application's state and data flow.
*   **Service Layer:**  `chatManager.ts` and `GeminiService.ts` act as a service layer, abstracting away the complexities of interacting with the Gemini API and the file system.
* **Memory Bank Pattern:** Implemented. The project uses a memory bank pattern for managing project context and documentation.

## Component Relationships

*   `AppSidebar` interacts with `projectManager` to save projects and with `chatSlice` and `appStateSlice` to manage UI state.
*   `ChatInterface` interacts with `chatSlice` to display and manage chat history and with `chatManager` to send messages.
*   `MarkdownViewer` displays Markdown content from the `projectSlice`.
*   `BookOutlineWizard` collects initial project parameters and triggers the skeleton generation process.
*   `ProjectOverview` combines `ChatInterface` and `MarkdownViewer` to provide the main project view.
*   `chatManager` interacts with `GeminiService` to communicate with the Gemini API, `promptBuilder` to construct prompts, and `projectsSlice` to update project data.
* `projectManager` uses Electron's IPC to interact with `fileOps.ts` in the main process for file system operations.
