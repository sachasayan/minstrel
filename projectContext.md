# Minstrel Chatbot Feature: Project Summary

This document summarizes the development of a chatbot feature for the Minstrel application, which allows users to co-write novels with an AI model (Gemini).

**Goal:** To create a system where users can interact with an AI model through a chat interface to collaboratively write a novel, progressing through stages of skeleton generation, outline creation, chapter writing, and critique.

**Architecture:**

- **Frontend:** React, Vite, TailwindCSS, Electron. Uses ShadCN UI components.
- **State Management:** Redux Toolkit (slices: `chatSlice`, `projectsSlice`, `appStateSlice`).
- **Communication:** The frontend service communicates with the Gemini API via the `chatManager.ts` module.
- **Prompt Engineering:** `promptBuilder.ts` constructs prompts based on the current state and context, including the latest user message and the content of relevant files. `prompts.ts` stores the base prompt and helper functions for formatting prompt components.
- **Context Management:** `promptBuilder.ts` handles determining which files are relevant as context for a given stage, using the `getFileContents` function.
- **File Handling:** File contents are stored in the Redux store (`projectSlice.current.files`). The model uses XML tags (`<write_file>`, `<get_context>`) to interact with files.
- **UI Components:**
  - `ChatInterface.tsx`: The main chat interface.
  - `MarkdownViewer.tsx`: Displays Markdown content using the `MDXEditor` component (with `headingsPlugin` and `listsPlugin`).
  - `BookOutlineWizard.tsx`: A multi-step form for gathering initial story parameters.
  - `ProjectOverview.tsx`: The main project view, which includes the `ChatInterface` and `MarkdownViewer`.
  - `NovelDashboard.tsx`: Displays project information (currently not used for displaying file content).
  - `App.tsx`: Handles routing and overall application structure.

**Workflow:**

1.  **Skeleton Generation:**

    - The user provides story parameters (title, genre, length, setting, plot, writing sample) through the `BookOutlineWizard`.
    - The "Dream" button triggers the `generateSkeleton` function in `chatManager.ts`.
    - `generateSkeleton` builds the initial prompt using `buildInitial` (from `promptBuilder.ts`) and sends it to the Gemini API.
    - The model responds with the skeleton content in Markdown, wrapped in `<write_file>` tags.
    - `chatManager.ts` parses the response, extracts the filename and content, and dispatches `updateFile` to store the skeleton in the Redux store (`projectSlice.current.files`).
    - The view switches to `project/editor` and the `activeFile` is set to `Skeleton.md`.
    - `ProjectOverview` renders `MarkdownViewer`, displaying the `Skeleton.md` content.

2.  **Outline Generation:**

    - The user clicks the "Proceed to Outline" button in the `AppSidebar`.
        - This dispatches an `addChatMessage` action with the message "Proceed to outline.".
        - The listener in `chatListeners.ts` intercepts this action and calls `sendMessage()`.
        - `sendMessage` calls `buildPrompt()`, which includes the latest user message and, if requested by the model, the content of `Skeleton.md`.
        - The model generates the outline and saves it to `Outline.md` using the `<write_file>` tag.
        - The `updateFile` action in `projectsSlice.ts` updates the Redux store.

3.  **Chapter Generation:**

    - The workflow will be similar to outline generation, but the context will include both the `Outline.md` and the previous chapter.

4.  **Critique Generation**

**Key Decisions and Discoveries:**

- **Prompt Building:** The `buildPrompt` function in `promptBuilder.ts` is responsible for constructing the complete prompt, including the base prompt, context, chat history, user message, and tool definitions.
- **Error Handling:** Basic error handling is implemented in `chatManager.ts`, with a retry mechanism for "resource exhausted" errors.
- **Markdown Parsing:** The `MDXEditor` component (used within `MarkdownViewer.tsx`) had issues parsing the model's Markdown output, specifically with list items followed by bold text. This was resolved by:
  - Adding the `listsPlugin` to the `MDXEditor`.
  - Removing the `prose` class.
- **File Naming:** The model is instructed to save files with specific names (`Skeleton.md`, `Outline.md`, `Chapter-X.md`, `Critique.md`).
- **Redux State Updates:** The `chatManager` is responsible for dispatching actions to update the Redux store, including adding/updating files, managing the chat history, and setting the active view and file.

**Remaining Issues/TODOs:**

- **Chapter Generation:** Implement the chapter generation workflow.
- **Critique Generation:** Implement the critique generation workflow.
- **Error Handling:** Expand error handling to be more robust and user-friendly.
- **UI/UX Improvements:** Improve the `ChatInterface` and overall user experience (loading states, feedback, etc.).
- **Versioning:** Implement a versioning system for files.
- **Testing:** Thoroughly test all aspects of the workflow.

**Important Notes:**

- The model is instructed to use XML tags for all its actions (writing files, getting context).
- The model is instructed to include `<think>` and `<summary>` tags in its responses.
- The `chatManager` uses recursion to handle the `<get_context>` tool.
- The `projectSlice` stores the file content in the `content` property of each file object.
- The `getDependencyList` function in `promptBuilder.ts` defines file dependencies: Outline depends on Skeleton, and Chapter-X depends on Outline and Chapter(X-1).
