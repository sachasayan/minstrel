#########
PROJECT BRIEF: MINSTREL
#########

# INTRO

I'm building an agentic LLM feature in this app, and I need help designing it. Since you are an agent designing an agent, and I am a user designing for a user, things might get confusing.

For this task, let's use these terms for clarity:

I, Me: The user, an engineer building the workflow.
You: Roo, the agent helping me build the prompt.
Us, We: Roo and the user (me).

Minstrel: The app we're building, which already has a codebase.
Chatbot: The feature we're building, which primarily consists of a remote model and a local service.
Model: The LLM to be called remotely.
Service: The local code handling side of the app.
Customer: The human who will be using the app.

Note: We may need two sides to the service — an encoder side which receives input from the human and delivers a processed input to the model, and another 'receiver' side which takes model output and processes it appropriately.

---

# TASK

We need to design and implement a feature which will allow the customer to write a novel with help from an AI model. All tasks involving customer interaction are handled through the chat interface, which sends messages to the model with the service as an intermediary. The model then sends a message back with actions, to be processed by the service.

The normal process for writing a novel is as follows:

(1) First the app sends story parameters (genre, title, etc.) to the model, which translates those patterns into a story skeleton consisting of a brief synopsis, characters, chapters, things to remember, etc. (Skeleton)

(2) The customer is allowed to edit the Skeleton to their leisure, then sends the Skeleton to the model, which generates an outline (Outline), consisting of full character descriptions, full environment descriptions, detailed per-scene plans for each chapter, and key objects.

(3) The customer is allowed to edit the Outline. The model then uses the Outline to create each chapter. (Chapter-1, Chapter-2, etc.)

(4) A message and critique is then produced. (Critique)

Any above step can be repeated. For instance, the customer may ask the model to re-write a previous chapter, or make adjustments to the outline, or regenerate the critique.

---

# RULES FOR THE MODEL

- The model must output ONLY within XML tags at the top level of its response.
- The model must use Markdown (within the relevant xml tag) as its syntax when writing files such as Skeleton, Outline, and Chapter-1
- The model must always begin with a <think> section, briefly explaining what it understands to be the current intent. This is hidden from the customer, but used for debugging.
- If the model thinks it is being asked to write to a file, it must first <read_file> for that file if it hasn't been provided. (Note: `<read_file>` now refers to reading data from the active project state).
- The model can use tools like <write_file> to perform actions via the service. (Note: `<write_file>` now translates to updating data in the active project state).
- The model must always end with a <message> section, briefly explaining the actions it has performed to the customer in first person, such as: "I've written Chapter 3."

---

# RULES FOR THE SERVICE

- The service communicates to the model using a mixture of markdown and xml.
- The service layer for the agentic feature primarily interacts with the active project data held in the Redux store (`projectsSlice`). Persistence (saving/loading project data including files and chat history) is handled via IPC calls to the main process, which interacts with the project's `.mns` (SQLite) file.
- The service always provides the base prompt to the model.
- The service can process XML tags from the model using regex.
- The service keeps a running history of the last twenty messages in the Chat slice of the Redux store, which contains a chatHistory array. (The reducer can be responsible for trimming history when it is full.)
- The service should always provide the full chat history between the customer and model when the customer sends a message.
- The service only stores excerpted content from <message> tags in the chat log from the model.

---

# CONTEXT

- For each request, the service should provide the model with appropriate context.
- Context consists of the relevant content (Skeleton, Outline, Chapters, etc.) from the currently loaded project data.
- When writing the skeleton, this means the story parameters provided by the customer.
- When writing the outline, this means the contents of the skeleton.
- When writing a chapter, this means the contents of the Outline file and the preceding Chapter.
- When writing a critique, this means every chapter in the novel.

---

# TOOL USE RULES

Multiple tools can be used in one response — for instance, a tool may update both a chapter and an outline at the same time.

Tool use is formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter (when required) is similarly enclosed within its own set of tags.

For example:

```
<write_file>
	<file_name>Chapter-1</file_name>
	<content>The content of a chapter would go here.</content>
</write_file> <!-- Note: This now updates data in the active project state, persisted via SQLite -->
```

The model must always adhere to this format for tool use. It must never deviate.

---

# SAMPLE FLOW

What follows is a sample flow between customer, service, and model. For brevity, the service dialogue will be shortened to symbolic tags here.

(User message:)

"Let's rewrite Chapter 3 and 4 to introduce the Asimov character."

(Service sends API request to model:)

{BASE_PROMPT}
{AVAILABLE_FILES} <!-- Represents available data sections like Outline, Chapter-2 etc. -->
{MESSAGE_FROM_USER}

(Model receives prompt from service, and provides a response:)

<think>It sounds like the customer wants me to edit Chapter 3 and 4, but I don't have context. I'll request the relevant data sections.</think>
<read_file>Outline</read_file>
<read_file>Chapter-2</read_file>
<read_file>Chapter-3</read_file>
<read_file>Chapter-4</read_file>

<message>I'm looking at the project data.</message>

(Service processes model response, retrieves data from Redux state, and then provides a response to the model with the context — Outline, Chapter 2, Chapter 3, and Chapter 4 content: )

{BASE_PROMPT}
{FILE_CONTENTS} <!-- Represents the actual content of requested sections -->
{MESSAGE_FROM_USER}

(Model now has context, and provides a response:)

<think>I'm ready to edit Chapter 3 and Chapter 4</think>
<write_file>
<file_name>Chapter-3</file_name>
<content>Chapter 3 content goes here.</content>
</write_file>
<write_file>
<file_name>Chapter-4</file_name>
<content>Chapter 4 content goes here.</content>
</write_file>

<message>I've made the requested changes to Chapter 3 and Chapter 4, and have introduced the Asimov character in Chapter 3.</message>

---

# RULES FOR ROO

We'll develop a development plan.

Give each item and sub-item in the development plan a status label of UNFINISHED / COMPLETE

Do not switch into coding mode until I say READY TO CODE

We'll update the development plan as we go along, marking items as COMPLETE. Item requirements may be adjusted as we go, but ask me before modifying the plan itself.

Once you are ready to mark an item as complete, stop and ask me for a code review. I'll let you know when to continue onto the new task.

Don't worry about type errors involving 'any' or 'unknown' types.

Don't worry about linting rules regarding preferred whitespace.

---
