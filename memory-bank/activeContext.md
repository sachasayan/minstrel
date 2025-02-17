# Plan for Further Prompt Improvements

This document outlines additional improvements to the prompt in `src/renderer/src/lib/prompts.ts`, based on a self-critique.

## Goals

1.  **Enhance Tool Descriptions:** Provide more detail about the expected behavior of `write_file` and `get_context`.
2.  **Incorporate Error Handling:** Add instructions on how the model should handle errors.
3.  **Specify Limitations:** Mention any known limitations of the model or tools.
4. **Address Chat History:** Consider how to incorporate chat history.

## Specific Changes

1.  **Tool Descriptions:**

    *   **`write_file`:** Add that it overwrites existing files.
    *   **`get_context`:** Emphasize that it returns the *entire* file content.

    Updated tool definitions:

    ```
    AVAILABLE TOOLS:

    \`\`\`xml
    <write_file>
      <file_name>{file_name}</file_name>
      <content>{file_content}</content>
    </write_file>
    \`\`\`
    Description: Writes the provided content to the specified file. **Overwrites the file if it already exists.**

    \`\`\`xml
    <get_context>{file_name}</get_context>
    \`\`\`
    Description: Requests the **full** content of the specified file as context. This tool can be used multiple times in a single response to request multiple files.
    ```

2.  **Error Handling:**

    Add a section on error handling:

    ```
    ERROR HANDLING:

    If an error occurs (e.g., a requested file doesn't exist, or a write operation fails), report the error in the `<summary>` section. Do not attempt to proceed with the task if a critical error occurs.
    ```

3.  **Limitations:**

    Add a section on limitations (placeholders for now, need to confirm actual limitations):

    ```
    LIMITATIONS:

    *   Maximum file size for `write_file`: [TODO: Determine limit]
    *   Maximum file size for `get_context`: [TODO: Determine limit]
    *  File types: Only Markdown (.md) files are supported.
    ```
4. **Chat History:**
    * Add to CONTEXT section: "The chat history between the user and Minstrel is also available as context."

## Next Steps

1.  Implement these changes in `src/renderer/src/lib/prompts.ts`.
