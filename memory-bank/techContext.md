# Minstrel Tech Context

## Technologies Used

*   **Frontend:**
    *   **React:** JavaScript library for building user interfaces.
    *   **Vite:** Fast build tool and development server.
    *   **TailwindCSS:** Utility-first CSS framework.
    *   **Electron:** Framework for building cross-platform desktop applications with web technologies.
    *   **ShadCN UI:** UI component library.
    *   **Lucide React:** Icon library.
    *   **Recharts:** Charting library.
    *   **MDXEditor:** Markdown editor component.
*   **State Management:**
    *   **Redux Toolkit:**  Library for managing application state.
*   **Communication:**
    *   **Electron IPC:** Inter-process communication between the main and renderer processes.
    *   **Gemini API:**  Google's Gemini API for AI model interaction.
*   **Backend:**
    *   **Node.js:** JavaScript runtime environment.
    *   **`fs/promises`:** Node.js file system module (promises version).
* **Other:**
    * **TypeScript:**  Superset of JavaScript that adds static typing.
    * **XMLParser:** Used for parsing XML responses from the Gemini API.

## Development Setup

The project is set up as an Electron application. The frontend is built with React, Vite, and TailwindCSS. The backend uses Node.js and interacts with the frontend through Electron's IPC.

## Technical Constraints

*   **Gemini API Limitations:** The project is dependent on the capabilities and limitations of the Gemini API.
*   **Electron Cross-Platform Compatibility:**  The application needs to be tested and maintained for cross-platform compatibility (primarily macOS, but potentially Windows and Linux).
* **Asynchronous Operations:** Dealing with asynchronous operations (API calls, file system access) requires careful handling to avoid race conditions and ensure data consistency.

## Dependencies

The project's dependencies are managed using `npm`. Key dependencies are listed above in the "Technologies Used" section. The full list of dependencies can be found in `package.json`.
