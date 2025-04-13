# Refactoring Plan: Markdown Parsing with Remark

**Goal:** Replace the current regex-based markdown parsing in `src/renderer/src/lib/dashboardUtils.ts` with a more robust AST-based approach using the `remark` library. This targets the `extractCharactersFromOutline` function.

**Current Approach:**

- Splits markdown content by lines.
- Uses regex to find a "Characters" heading.
- Uses regex (`/^[*-]\s+\*\*([\p{L}\s]+)[-:]\*\*/iu`) to extract bolded list items under the heading.
- Limitations: Brittle, sensitive to formatting variations.

**Proposed Plan:**

1.  **Dependency Installation:**

    - Add `remark` and `unist-util-visit` as project dependencies.

    ```bash
    npm install remark unist-util-visit
    # or
    yarn add remark unist-util-visit
    ```

2.  **Refactor `extractCharactersFromOutline`:**

    - Import `remark` from 'remark' and `visit` from 'unist-util-visit'.
    - Parse `outlineContent` using `remark().parse(outlineContent)` to get the Markdown AST (mdast).
    - Use `visit` to traverse the AST.
    - **Identify "Characters" Section:** Find a `heading` node whose text content is "Characters". Track state with an `inCharacterSection` flag.
    - **Extract Character Names:**
      - Once in the section, look for subsequent `list` nodes.
      - Visit `listItem` children.
      - Inside `listItem`, find `strong` nodes.
      - Extract the `value` from the `text` node(s) inside `strong`.
      - Add the extracted name to the `characters` array (`{ name: string }[]`).
      - Stop processing lists if another `heading` is encountered.
    - Return the `characters` array.

3.  **Verification:**
    - Ensure `getCharacterFrequencyData` still works correctly.
    - Test with various markdown inputs (edge cases, formatting variations).

**AST Traversal Visualization:**

```mermaid
graph TD
    A[Start: Parse Markdown with Remark] --> B(Root Node);
    B --> C{Visit Nodes};
    C --> D{Is Node a Heading?};
    D -- Yes --> E{Text = "Characters"?};
    D -- No --> C;
    E -- Yes --> F[Set 'inCharacterSection' = true];
    E -- No --> C;
    F --> C;
    C --> G{Is Node a Heading AND 'inCharacterSection' = true?};
    G -- Yes --> H[Set 'inCharacterSection' = false, Stop List Processing];
    G -- No --> I{Is Node a List AND 'inCharacterSection' = true?};
    H --> C;
    I -- Yes --> J{Visit ListItems};
    I -- No --> C;
    J --> K{Visit ListItem Children};
    K --> L{Is Node 'strong'?};
    L -- Yes --> M{Extract Text Value};
    M --> N[Add to Characters Array];
    N --> K;
    L -- No --> K;
    K --> J;
    J --> I;
```

**Benefits:**

- **Robustness:** Less prone to breaking with formatting changes.
- **Extensibility:** Easier to adapt for future needs.
- **Maintainability:** Clearer code reflecting the parsed structure.
