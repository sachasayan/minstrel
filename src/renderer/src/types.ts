export interface AppSettings {
  api?: string
  apiKey?: string
  workingRootDirectory?: string | null
}
export interface AppState {
  projectList: ProjectFragment[]
  activeView: ActiveView
  activeFile: string | null
}
export interface ProjectState {
  projectHasLiveEdits: boolean
  activeProject: Project | null
  pendingFiles: string[] | null
}

export interface Project extends ProjectFragment {
  files: ProjectFile[]
  summary: string
  year: number
  writingSample: string
  expertSuggestions: ExpertSuggestion[]
  knowledgeGraph: KnowledgeGraph | null
  chatHistory?: ChatMessage[] // ADDED chatHistory field
}
export interface ProjectFragment {
  projectPath: string
  title: string
  genre: Genre
  wordCountTarget: number
  wordCountCurrent: number
  cover?: string
}

export interface ProjectFile {
  title: string
  content: string
  wordcount?: number
  hasEdits?: boolean
}

export interface KnowledgeGraph {
  characters: string[] | null
  environments: string[] | null
  chapters: string[] | null
}


export interface ExpertSuggestion {
  name: string
  expertise?: string
  rating: number
  critique: string
}

export interface ChatMessage { // Assuming ChatMessage interface exists
  sender: string;
  text: string;
  timestamp?: string; // Optional timestamp, adjust if needed
  metadata?: any;     // Optional metadata, adjust type if needed
}

// interface SceneOutline {
//   description: string
// }

// export interface ChapterOutline {
//   title: string
//   scenes: SceneOutline[]
// }

export interface AppListenerApi {
  dispatch: () => any
  getState: () => any
  getOriginalState: () => any
}

export interface RequestContext {
  currentStep: number
  agent: 'criticAgent' | 'outlineAgent' | 'routingAgent' | 'writerAgent'
  carriedContext?: string
  sequenceInfo?: string
  requestedFiles?: string[]
  message?: string
}

export type ActiveView = 'intro' | 'wizard' | 'project/outline' | 'project/dashboard' | 'project/editor' | 'project/parameters'

export type Genre =
  | 'dystopian-post-apocalyptic-climate-fiction'
  | 'dystopian-post-apocalyptic-ya-dystopia'
  | 'dystopian-post-apocalyptic'
  | 'fantasy-dark-fantasy'
  | 'fantasy-high-fantasy'
  | 'fantasy-low-fantasy'
  | 'fantasy-portal-fantasy'
  | 'fantasy-urban-fantasy'
  | 'fantasy'
  | 'historical-fiction-alternate-history'
  | 'historical-fiction-biographical-fiction'
  | 'historical-fiction'
  | 'historical'
  | 'horror-body-horror'
  | 'horror-cosmic-horror'
  | 'horror-psychological-horror'
  | 'horror-supernatural-horror'
  | 'horror'
  | 'mystery-thriller-crime-thriller'
  | 'mystery-thriller-noir'
  | 'mystery-thriller-police-procedural'
  | 'mystery-thriller-psychological-thriller'
  | 'mystery-thriller'
  | 'romance-contemporary-romance'
  | 'romance-historical-romance'
  | 'romance-lgbtq-romance'
  | 'romance-paranormal-romance'
  | 'romance-romantic-suspense'
  | 'romance'
  | 'science-fiction-cyberpunk'
  | 'science-fiction-hard-sci-fi'
  | 'science-fiction-post-apocalyptic'
  | 'science-fiction-soft-sci-fi'
  | 'science-fiction-space-opera'
  | 'science-fiction-time-travel'
  | 'science-fiction'
  | 'science-technology-ai-tech'
  | 'science-technology'
  | 'self-help-personal-development-mindfulness'
  | 'self-help-personal-development-productivity'
  | 'slice-of-life'
  | 'true-crime-'
  | 'true-crime-white-collar-crime'
  | 'true-crime'
