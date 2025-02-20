# Minstrel Tech Context

## Technologies Used

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

## Dependencies

The project's dependencies are managed using `npm`. Key dependencies are listed above in the "Technologies Used" section. The full list of dependencies can be found in `package.json`.

- **Multi-Agent Architecture:** The project now uses a multi-agent architecture with a routing agent delegating tasks to specialized agents (criticAgent, outlineAgent, writerAgent).
    - **Routing Agent:**  Responsible for initial request handling and agent delegation. Defined in `promptBuilder.ts` and used by default in `chatManager.ts`.
    - **Specialized Agents:** `criticAgent`, `outlineAgent`, `writerAgent` are designed for specific tasks. Prompts for these agents are defined in `prompts.ts` (to be reviewed and refined).
    - **Agent Switching:** `chatManager.ts` processes the `<route_to>` tag in the model's response to switch agents dynamically.
    - **Context Handling:**  `promptBuilder.ts` constructs prompts with relevant context for each agent, including user messages, available files, and file contents.


## Do not read files named

* criticAgent.ts
* outlineAgent.ts
* promptsUtils.ts
* routingAgent.ts
* writerAgent.ts

## Testing

Mock projects for testing are located in the `mock-projects` folder. The available mock projects are:

- Romance Island
- Science Station 2
- Western 3
