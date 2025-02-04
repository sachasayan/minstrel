import { prompts } from "./prompts";
import { store } from '@/lib/utils/store';


const dependencyList =  (fileName: string, availableFiles: string[]): string[] => {
  const dependencies: string[] = [];
  if (fileName === 'Outline.md') {
    dependencies.push('Skeleton.md');
  }
  if (fileName.startsWith('Chapter')) {
    dependencies.push('Outline.md');
    // Find the previous chapter.  Assume file naming convention of "ChapterX.md", pluck all the numbers
    const chapterNumber = fileName.match(/\d+/)
    if (!!chapterNumber && parseInt(chapterNumber[0], 10) > 1) {
      dependencies.push(`Chapter${parseInt(chapterNumber[0], 10) - 1}.md`);
    }
  }
  if (fileName === 'Critique.md') {
    return availableFiles.filter((file) => file.startsWith('Chapter'));
  }

  return dependencies;
}

// Gets all available files
export const getAvailableFiles = (): string[] => {
  return store.getState().projects.activeProject?.files.map((f) => f.title) || [];
}

// Gets just dependencies for the given file, as content
export const getContextItems = (fileName): string => {
  // Get the dependencies for the given file, ie [Skeleton.md, Outline.md, Chapter01.md]
  const dependencies = dependencyList(fileName, getAvailableFiles());

  // Get each file as a context item
  const activeProject = store.getState().projects.activeProject;
  const context: string = activeProject?.files.filter((f) => dependencies.includes(f.title)).map((file) => `
    ---
    file: ${file.title}
    content: ${file.content}
    `).join('\n') || '';

  return context;
};




export const buildInitial = (parameters: object): string => {
  let prompt = prompts.getBasePrompt();

  prompt += prompts.getUserPrompt(`Generate the story skeleton using these parameters:`);

  prompt += prompts.getParameters(parameters);

  return prompt;
};

export const buildPrompt = (dependencies?: string[] | null): string => {
  let prompt = prompts.getBasePrompt();
  if (!dependencies) {
    dependencies = getAvailableFiles();
  }
  if (dependencies) {
    // Get the context items for the given dependencies
    prompt += `\nAvailable Files:\n${dependencies.join('\n')}\n`;
    // prompt += prompts.getContextItems(dependencies); REMOVED
  }


  // if (chatHistory) {
  //   prompt += prompts.getChatHistory(chatHistory);
  // }

  return prompt;
};
