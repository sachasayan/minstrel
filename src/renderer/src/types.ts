export interface RecentProject {
  projectPath: string
  title: string
  genre: Genre
  cover?: string
  coverImageMimeType?: string | null
  wordCountCurrent?: number
  lastOpenedAt: string // ISO timestamp
}

export interface AppSettings {
  workingRootDirectory?: string | null
  highPreferenceModelId?: string
  lowPreferenceModelId?: string
  // Provider configuration
  provider?: string
  googleApiKey?: string
  deepseekApiKey?: string
  zaiApiKey?: string
  openaiApiKey?: string
  recentProjects?: RecentProject[]
}
export interface AppState {
  projectList: ProjectFragment[]
  activeView: ActiveView
  activeSection: string | null
}
export interface ProjectState {
  projectHasLiveEdits: boolean
  activeProject: Project | null
  pendingFiles: string[] | null
  modifiedChapters: number[] // Track unsaved chapter changes
  lastEdit?: {
    fileTitle: string
    oldContent: string
    newContent: string
    chapterIndex?: number
    chapterId?: string
  } | null
}

export interface Project extends ProjectFragment {
  storyContent: string
  files: ProjectFile[]
  summary: string // Consider if this is still needed or replaced by outline doc
  year: number
  expertSuggestions: ExpertSuggestion[]
  knowledgeGraph: KnowledgeGraph | null
  chatHistory?: ChatMessage[]
  coverImageBase64?: string | null // Base64 encoded image data
  // coverImageMimeType is inherited from ProjectFragment and now allows null
  dialogueAnalysis?: {
    dialogCounts: Record<string, number[]>
  } | null
  wordCountHistorical?: Array<{
    date: string // 'YYYY-MM-DD'
    wordCount: number
  }>
}
export interface ProjectFragment {
  projectPath: string
  title: string
  genre: Genre
  wordCountTarget: number
  wordCountCurrent: number
  cover?: string
  coverImageMimeType?: string | null
}

export interface ProjectFile {
  title: string
  content: string
  wordcount?: number
  hasEdits?: boolean
  chapterIndex?: number // NEW: Track which chapter is being edited
  type?: string
  sort_order?: number
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

export interface ChatMessage {
  sender: string
  text: string
  timestamp?: string
  metadata?: any
}

export interface AppListenerApi {
  dispatch: () => any
  getState: () => any
  getOriginalState: () => any
}

export interface RequestContext {
  currentStep: number
  agent: 'routingAgent' | 'writerAgent'
  sequenceInfo?: string
  requestedFiles?: string[]
  message?: string
  modelPreference?: 'high' | 'low'
}

export type ActiveView = 'intro' | 'project/outline' | 'project/editor' | 'project/parameters'

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
  | 'adventure-survival'
  | 'dystopian-cyberpunk'
  | 'dystopian-future'
  | 'dystopian-totalitarian-regime'
  | 'fantasy-medieval-kingdom'
  | 'fantasy-middle-earth'
  | 'fantasy-mythological'
  | 'fantasy-wizard-world'
  | 'historical-fiction-american-civil-war'
  | 'historical-fiction-medieval-europe'
  | 'horror-folk-horror'
  | 'humor-dark-comedy'
  | 'mystery-thriller-organized-crime'
  | 'mystery-cozy-mystery'
  | 'mystery-small-town-secrets'
  | 'romance-slow-burn'
  | 'science-fiction-alien-planet'
  | 'science-fiction-artificial-intelligence'
  | 'science-fiction-mars-colony'
  | 'science-fiction-space'
  | 'thriller-espionage'
  | 'thriller-tech-thriller'
