# Plan for Further Prompt Improvements

This document outlines additional improvements to the prompt in `src/renderer/src/lib/prompts.ts`, based on a self-critique.

## Goals

1.  **Enhance Tool Descriptions:** Provide more detail about the expected behavior of `write_file` and `get_context`.
2.  **Incorporate Error Handling:** Add instructions on how the model should handle errors.
3.  **Specify Limitations:** Mention any known limitations of the model or tools.
4. **Address Chat History:** Consider how to incorporate chat history.

## Specific Changes

1.  **Tool Descriptions:**

    *   The tool descriptions for `write_file` and `get_context` are already detailed in `src/renderer/src/lib/prompts.ts`.

2.  **Error Handling:**

    *   Error handling instructions are already included in `src/renderer/src/lib/prompts.ts`.

3.  **Limitations:**

    *   A limitations section exists in `src/renderer/src/lib/prompts.ts`, specifying a 20,000 character limit for `write_file` and restricting file types to Markdown (.md).

4.  **Chat History:**
    *   Chat history is already included as part of the context in `src/renderer/src/lib/prompts.ts`.
