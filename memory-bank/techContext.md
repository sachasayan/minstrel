# Minstrel Project Context

## System Patterns

Minstrel follows a client-server architecture, with a React/Vite/Electron frontend and a backend service that interacts with the Gemini API. The core components and their interactions are as follows:

- **Frontend (Renderer Process):**
  - **UI Components:** React components built using ShadCN UI. Handles user interaction, displays data, and dispatches actions to the Redux store. Key components include `AppSidebar`, `ChatInterface`, `MarkdownViewer`, `ProjectOverview`, `BookOutlineWizard`, and `Chart.tsx`.
  - **Book Outline Wizard Pages:** The `BookOutlineWizard` feature is split into multiple page components located in `src/renderer/src/components/BookWizard`: `Intro`, `StoryLength`, `SettingAndTitle`, `PlotPage`, `WritingSamplePage`, and `SummaryPage`. These components manage the different steps of the book outline wizard flow.
  - **State Management:** Redux Toolkit manages the application state, including chat history (`chatSlice`), project data (`projectsSlice`), and application state (`appStateSlice`).
  - **Service Logic:** `chatManager.ts` handles communication with the Gemini API, prompt building, and response processing. `projectManager.ts` handles project loading, saving, and file system operations.
  - **Prompt Engineering:** `promptBuilder.ts` constructs prompts dynamically based on the current state and context. `prompts.ts` stores the static parts of the prompts.
- **Backend (Main Process):**
  - **`fileOps.ts`:** Handles file system operations (reading directories, reading files, writing files, creating directories) through Electron's IPC.
  - **`llmService.ts`:** (In the renderer process, but conceptually part of the backend) Abstraction layer for interacting with the Gemini API.

### Component Relationships

- `AppSidebar` interacts with `fileService` to save projects and with `chatSlice` and `appStateSlice` to manage UI state.
- `ChatInterface` interacts with `chatSlice` to display and manage chat history and with `chatService` to send messages.
- `MarkdownViewer` displays Markdown content from the `projectSlice`.
- `BookOutlineWizard` (container component) orchestrates the book outline wizard flow and renders the page components.
- `Intro`, `StoryLength`, `SettingAndTitle`, `PlotPage`, `WritingSamplePage`, `SummaryPage` (page components) handle individual wizard steps and user input within the Book Outline Wizard.
- `ProjectOverview` combines `ChatInterface` and `MarkdownViewer` to provide the main project view.
- `chatService` interacts with `llmService` to communicate with the Gemini API, `promptBuilder` to construct prompts, and `projectsSlice` to update project data.
- `fileService` uses Electron's IPC to interact with `fileOps.ts` in the main process for file system operations.

---

## Tech Context

### Technologies Used

- **Frontend:**
  - **React:** JavaScript library for building user interfaces.
  - **Vite:** Fast build tool and development server.
  - **TailwindCSS:** Utility-first CSS framework.
  - **Electron:** Framework for building cross-platform desktop applications with web technologies.
  - **ShadCN UI:** UI component library.
  - **Lucide React:** Icon library
  - **Recharts:** Charting library.
  - **MDXEditor:** Markdown editor component.
- **State Management:**
  - **Redux Toolkit:** Library for managing application state.
- **Communication:**
  - **Electron IPC:** Inter-process communication between the main and renderer processes.
  - **Gemini API:** Google's Gemini API for AI model interaction.
- **Backend:**
  - **Node.js:** JavaScript runtime environment.
  - **`fs/promises`:** Node.js file system module (promises version).
- **Other:**
  - **TypeScript:** Superset of JavaScript that adds static typing.
  - **XMLParser:** Used for parsing XML responses from the Gemini API.

### Dependencies

The project's dependencies are managed using `npm`. Key dependencies are listed above in the "Technologies Used" section. The full list of dependencies can be found in `package.json`.

### Multi-Agent Architecture

The project now uses a multi-agent architecture with a routing agent delegating tasks to specialized agents (criticAgent, outlineAgent, writerAgent).

    - **Routing Agent:**  Responsible for initial request handling and agent delegation. Defined in `promptBuilder.ts` and used by default in `chatManager.ts`.
    - **Specialized Agents:** `criticAgent`, `outlineAgent`, `writerAgent` are designed for specific tasks. Prompts for these agents are defined in `prompts.ts` (to be reviewed and refined).
    - **Agent Switching:** `chatManager.ts` processes the `<route_to>` tag in the model's response to switch agents dynamically.
    - **Context Handling:**  `promptBuilder.ts` constructs prompts with relevant context for each agent, including user messages, available files, and file contents.

### Do not read files named

- criticAgent.ts
- outlineAgent.ts
- promptsUtils.ts
- routingAgent.ts
- writerAgent.ts

### Testing

Mock projects for testing are located in the `mock-projects` folder. The available mock projects are:

- Romance Island
- Science Station 2
- Western 3
