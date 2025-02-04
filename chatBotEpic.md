# Chatbot Feature Development Plan

This document outlines the development plan for the chatbot feature, which will allow customers to co-write a novel with an AI model.

## Phase 1: Basic Workflow

This phase focuses on implementing the core workflow of generating a skeleton, outline, and chapters.

1.  **Setup:**
    *   Create `chatBotEpic.md` (COMPLETE)
    *   Review and potentially modify `chatManager.ts` for middleware. (COMPLETE)
    *   Ensure `GeminiService.ts` is correctly used for API requests. (COMPLETE)
    *   Create basic file structure and components (if needed). (COMPLETE - Created `contextManager.ts`)

2.  **Skeleton Generation:**
    *   Implement service logic in `chatManager.ts` to send story parameters (from `BookOutlineWizard.tsx`?) to the model via `GeminiService.ts`. (COMPLETE)
    *   Implement prompt building (using `promptBuilder.ts`?) to include the base prompt, story parameters, and tool definitions. (COMPLETE)
    *   Implement model logic (prompt) to generate `Skeleton.md` content. (COMPLETE)
    *   Implement service logic in `chatManager.ts` to receive the response, parse the XML, and store `Skeleton.md` in `projectSlice.current`. (COMPLETE)
    *   Implement UI to display `Skeleton.md` to the customer (likely in `ChatInterface.tsx`). (COMPLETE)

3.  **Outline Generation:**
    *   Implement service logic in `chatManager.ts` to send `Skeleton.md` to the model. (COMPLETE)
    *   Implement prompt building to include the base prompt, `Skeleton.md` content, and tool definitions. (COMPLETE)
    *   Implement model logic (prompt) to generate `Outline.md` content. (UNFINISHED)
    *   Implement service logic in `chatManager.ts` to receive the response, parse the XML, and store `Outline.md` in `projectSlice.current`. (UNFINISHED)
    *   Implement UI to display `Outline.md` to the customer. (UNFINISHED)

4.  **Chapter Generation:**
    *   Implement service logic in `chatManager.ts` to send `Outline.md` and the previous chapter (if applicable) to the model. (UNFINISHED)
    *   Implement prompt building to include the base prompt, `Outline.md` content, previous chapter content, and tool definitions. (Partially COMPLETE - Needs integration with the chapter generation flow)
    *   Implement model logic (prompt) to generate `ChapterX.md` content. (UNFINISHED)
    *   Implement service logic in `chatManager.ts` to receive the response, parse the XML, and store `ChapterX.md` in `projectSlice.current`. (Partially COMPLETE - Parsing and storing logic exists, but needs to be integrated with the chapter generation flow)
    *   Implement UI to display `ChapterX.md` to the customer. (UNFINISHED)

5.  **Critique Generation:**
    *   Implement service logic in `chatManager.ts` to send all chapters to the model. (UNFINISHED)
    *   Implement prompt building to include the base prompt, all chapter content, and tool definitions. (Partially COMPLETE - Needs integration with the critique generation flow)
    *   Implement model logic (prompt) to generate `Critique.md` content. (UNFINISHED)
    *   Implement service logic in `chatManager.ts` to receive the response, parse the XML, and store `Critique.md` in `projectSlice.current`. (Partially COMPLETE - Parsing and storing logic exists, but needs to be integrated with the critique generation flow)
    *   Implement UI to display `Critique.md` to the customer. (UNFINISHED)

## Phase 2: Refinements and Error Handling

This phase focuses on improving the user experience and handling potential errors.

1.  **Chat History Management:**
    *   Implement service logic in `chatManager.ts` to manage chat history (last 20 messages) in `chatSlice.ts`. (COMPLETE)
    *   Implement service logic to store only `<summary>` excerpts in the chat log. (COMPLETE)

2.  **Context Management:**
    *   Implement service logic in `chatManager.ts` to determine relevant context based on the dependency list (Skeleton, Outline, Critique, Chapters). (COMPLETE)
    *   Implement logic to provide the model with a list of available files. (COMPLETE)

3.  **Error Handling:**
    *   Implement basic error handling in `chatManager.ts` and `GeminiService.ts`. (Partially COMPLETE - Basic error handling exists, but needs to be expanded)

4.  **UI/UX Improvements:**
    *   Improve the `ChatInterface.tsx` for better user interaction. (UNFINISHED)
    *   Implement loading states and feedback mechanisms. (UNFINISHED)

5.  **Versioning:** (Defer to later)

## Phase 3: Advanced Features (Optional)

This phase includes additional features that could enhance the chatbot's capabilities.

1.  **Regeneration/Rewriting:**
    *   Implement service and model logic to allow regenerating/rewriting specific parts of the novel. (UNFINISHED)

2.  **User Editing:**
    *   Allow the user to directly edit the generated files within the app. (UNFINISHED)

3. **User Messages:**
    * Implement logic for user to send messages/prompts to the model after skeleton generation. (UNFINISHED)

4.  **Additional Tools:**
    *   Explore the possibility of adding more tools for the model to use. (UNFINISHED)

## Tool Definitions

The model will use the following tools:

*   `<get_context>`: Requests the content of a specific file.
    *   Parameters:
        *   `<file_name>`: The name of the file to retrieve.
*   `<write_file>`: Writes content to a file.
    *   Parameters:
        *   `<file_name>`: The name of the file to write to.
        *   `<content>`: The content to write.
