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
}

export interface Project extends ProjectFragment {
  files: ProjectFile[]
  summary: string
  year: number
  totalWordCount: number
  expertSuggestions: ExpertSuggestion[]
}
export interface ProjectFragment {
  id: string
  title: string
  fullPath: string
  genre: Genre
  cover?: string
}

export interface ProjectFile {
  title: string
  content: string
  wordcount?: number
  hasEdits: boolean
}

export interface ExpertSuggestion {
  expert: string
  publication?: string
  rating: number
  comment: string
}
// interface SceneOutline {
//   description: string
// }

// export interface ChapterOutline {
//   title: string
//   scenes: SceneOutline[]
// }

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
