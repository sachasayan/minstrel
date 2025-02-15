# Minstrel Progress

## What Works

*   **Skeleton Generation:** The user can input story parameters and generate a story skeleton.
*   **Outline Generation:** The user can trigger the generation of a story outline based on the skeleton.
*   **Chat Interface:** The user can interact with the AI model through a collapsible chat interface.
*   **File Management:**
    *   File contents are stored in the Redux store.
    *   Files can be saved to the file system.
    *   Project directories are created automatically when saving new projects.
    *   Errors during file system operations are caught and reported.
*   **State Management:** Redux Toolkit manages the application state effectively.
*   **Prompt Building:** Prompts are constructed dynamically, including context and user messages.
*   **Basic Error Handling:** Error handling is in place for API calls and file system operations.
* **Sidebar:** The sidebar provides navigation and project management features, including a collapsible design and dynamic chapter icons.
* **User Messages:** The user can send messages to the model after skeleton generation.
* **Chat History Management:** The chat history is managed, storing the last 20 messages.
* **Context Management:** The service determines and provides relevant context to the model.

## What's Left to Build

*   **Chapter Generation:**  Full implementation of the chapter generation workflow, including model logic and UI integration.
*   **Critique Generation:** Implementation of the critique generation workflow.
*   **Expanded Error Handling:** More robust and user-friendly error handling throughout the application.
*   **UI/UX Improvements:**  Further refinement of the user interface and user experience, including loading states, feedback mechanisms, and overall polish.
*   **Versioning:** Implementation of a versioning system for project files.
*   **Testing:** Comprehensive testing of all features and workflows.
*   **Regeneration/Rewriting:** Implement service and model logic to allow regenerating/rewriting specific parts of the novel.
*   **User Editing:** Allow the user to directly edit the generated files within the app.
*  **Additional Tools:** Explore the possibility of adding more tools for the model to use.

## Known Issues

*   Minor UI/UX issues may exist.
*   Chapter and critique generation are not yet implemented.
*   Error handling could be more comprehensive.
