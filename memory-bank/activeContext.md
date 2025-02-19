# Current Task: Implement and Refine the `<sequence>` Tool

## Status

We are currently working on implementing and refining the `<sequence>` tool, which allows the AI to perform a series of actions, such as writing multiple chapters in a row.

## Completed Steps

1.  **Refactored `<get_context>` to `<read_file>`:** We updated the `projectBrief.md` and `prompts.ts` files to instruct the model to use the `<read_file>` tool for requesting file content, replacing the previous `<get_context>` instruction.

2.  **Improved Suggested Actions in `ChatInterface`:** We modified `ChatInterface.tsx` to dynamically suggest the next logical action (Create Skeleton, Create Outline, Write Chapter X) based on the chat history and the existing project files.

3.  **Implemented Basic `<sequence>` Tool Functionality:**
    *   Added the `<sequence>` tool definition and instructions to `prompts.ts`.
    *   Updated `promptBuilder.ts` to include `sequence_plan` and `currentStep` in the prompt context.
    *   Modified `chatManager.ts` to:
        *   Recognize the `<sequence>` tag.
        *   Parse the `sequence_plan` (as a Markdown numbered list) and `currentStep` attribute.
        *   Set `recursionDepth` to 10 when a sequence is initiated.
        *   Ignore the `<sequence>` tag if it's not the first turn.
        *   Pass the `sequence_plan` and `currentStep` to `buildPrompt`.

## Remaining Issues and Tasks

1.  **Prompt Engineering for Sequences:** The initial implementation of the `<sequence>` tool is not working as expected. The AI is not initiating a sequence when prompted to write multiple chapters. We need to refine the prompt to better encourage the use of the `<sequence>` tool in appropriate situations.

2.  **Testing and Iteration:** We need to thoroughly test the sequence functionality with various scenarios and iterate on the prompt and logic based on the results.

3.  **Error Handling:** We should consider additional error handling within sequences (e.g., what happens if a file write fails in the middle of a sequence).

## Next Steps

Our immediate next step is to focus on prompt engineering to improve the AI's use of the `<sequence>` tool:

1.  **Review `prompts.ts`:** Examine the current instructions and examples related to the `<sequence>` tool.
2.  **Add a More Compelling Example:** Include a specific example in `prompts.ts` where the user explicitly asks for multiple chapters, and the AI responds with a `<sequence>` plan.
3.  **Strengthen Wording:** Make the instructions about *when* to use a sequence more explicit.

After these changes, we will test the "write Chapters 1-4" command again.
