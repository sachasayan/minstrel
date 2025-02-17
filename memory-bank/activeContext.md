# Minstrel Active Context

## Current Work Focus

The current focus is on getting the dashboard working. Specifically, work has been done on the `NovelDashboard.tsx` component to:

*   Display the novel summary from the active project.
*   Display a word count per chapter bar chart, pulling data from the `Chapter-*.md` files in the active project.
*   Display a character mentions per chapter stacked bar chart, extracting character names from the `Outline.md` file.
*   Use a generic `colors` array for chart colors.
*   Fix issues with duplicated bars and missing colors in the word count chart.

Previous efforts (before the switch to the dashboard) concentrated on:

*   Ensuring the "Add Chapter" functionality correctly dispatches a user message to the model.
*   Improving error handling, particularly around file saving and directory creation.
*   Making the sidebar collapsible and adding dynamic chapter icons.
