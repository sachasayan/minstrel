export const getCriticAgentPrompt = () => `

---

## CURRENT TASK: CRITIQUE THE STORY

* The user is asking you to critique the story. They have provided the outline, and every available chapter of the story.
* Use the <think> tool to pick three experts with professional relevance to this story.
* They may be a literary critic, historian, politician, doctor, artist, musician, linguist, scientist, politician etc.
* Each expert should have unique perspective on the book.
* The critiques should analyze the story's strengths and weaknesses and suggest areas for improvement. They should be harsh, but fair.
* Write in paragraph form, from the perspective of the expert.
* Up to five paragraphs may be written per expert.
* The story may be unfinished. If so, review the book as an in-progress work.
* The story may contain a mismatch between the the outline and the number of chapters provided. Review the provided chapters only.

# CREATING A STRUCTURED RESPONSE

* This task provides output in JSON format via the <critique> tool and does not ever involve a <write_file> tool.
* Only one critique tag pair is used.
* The JSON output must be a single object with exactly two properties, in this order:
* "critique": an array of three expert objects. Each object contains:
  - "name": the expert's name. (string)
  - "expertise": their field of focus. (string)
  - "critique": short paragraph summary (max 200 chars) of their critique. (string)
  - "rating": integer from 1-5. (number)
* "analysis": an object containing at least:
  - "dialogCounts": a map where each key is a **main** character's name (string), and each value is an **array** of integers.
  - The array length equals the total chapters, where each integer is the total number of that character's spoken dialogue sentences **for that chapter**.
  - When counting, split character speech by sentences.
  - Exclude any sentence fragments or interjections **shorter than 3 words**.
  - Include all main characters explicitly; if zero sentences for a chapter, put '0' in that chapter's array position.
  - Do NOT include minor or side characters.
  - Ignore unattributed dialogue entirely.
* The experts' critiques should NOT reference the analysis data — it is included purely for the user's review.
* If you cannot complete the task for any reason, do not output the <critique> tag. Apologize and explain why the task couldn't be completed using <message>.
* Use the <summary> tool to let the user know the critiques have been written.

## SAMPLE INTERACTION:

User: "Please write a critique."


<think>The user wants to critique of the storyline. It looks like I have all the required files.</think>
<critique>
{
  "critique": [
    {
      "name": "Alice Johnson",
      "expertise": "Fantasy Writer",
      "rating": 3,
      "critique": "A captivating tale with engaging themes and solid pacing."
    },
    {
      "name": "Michael Chen",
      "expertise": "Character Consultant",
      "rating": 4,
      "critique": "Well-executed world-building; character motivations could be clearer."
    },
    {
      "name": "Sophia Rodriguez",
      "expertise": "Literary Critic",
      "rating": 4,
      "critique": "Balances action and introspection effectively. Prose is vivid."
    }
  ],
  "analysis": {
    "dialogCounts": {
      "Alice": [12, 8, 15],
      "Bob": [3, 0, 9],
      "Eve": [0, 0, 4]
    }
  }
}
</critique>
<message>The critics have weighed in.</message>


---

END SYSTEM PROMPT
BEGIN USER PROMPT

* The user may also provide you with the contents of any files needed for the current task.
`

