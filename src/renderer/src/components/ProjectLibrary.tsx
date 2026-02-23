import { ReactNode } from 'react'
import { RecentProject } from '@/types'
import { BookPlusIcon, FolderOpenIcon } from 'lucide-react'

interface ProjectLibraryProps {
  recentProjects: RecentProject[]
  onProjectSelect: (projectPath: string) => void
  onNew: () => void
  onOpen: () => void
}

const formatRelativeDate = (isoString: string): string => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface RecentCardProps {
  project: RecentProject
  onClick: () => void
}

const RecentCard = ({ project, onClick }: RecentCardProps): ReactNode => {
  const backgroundImageUrl = project.cover
    ? `url("${project.cover}")`
    : `url("/covers/${project.genre}.png")`

  return (
    <div className="relative rounded-lg shadow-md overflow-hidden transition-transform w-50 duration-300 hover:scale-105 cursor-pointer select-none" onClick={onClick}>
      <div className="relative" style={{ paddingTop: '175%' }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: backgroundImageUrl }}
        >
          <div className="p-4 absolute bottom-0 left-0 right-0 bg-neutral-50">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{project.title}</h3>
            <p className="text-sm text-gray-600">
              {project.wordCountCurrent != null ? `${project.wordCountCurrent.toLocaleString()} words` : ''}
              {project.wordCountCurrent != null ? ' · ' : ''}
              {formatRelativeDate(project.lastOpenedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActionCardProps {
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

const ActionCard = ({ icon, label, onClick, variant = 'primary' }: ActionCardProps): ReactNode => {
  const isPrimary = variant === 'primary'
  return (
    <div
      className={`relative rounded-lg shadow-md overflow-hidden transition-transform w-50 duration-300 hover:scale-105 cursor-pointer select-none`}
      onClick={onClick}
    >
      <div className="relative" style={{ paddingTop: '175%' }}>
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${isPrimary ? 'bg-primary' : 'bg-secondary'}`}>
          <div className={isPrimary ? 'text-primary-foreground' : 'text-secondary-foreground'}>
            {icon}
          </div>
          <h3 className={`text-lg font-semibold ${isPrimary ? 'text-primary-foreground' : 'text-secondary-foreground'}`}>
            {label}
          </h3>
        </div>
      </div>
    </div>
  )
}

const ProjectLibrary = ({ recentProjects, onProjectSelect, onNew, onOpen }: ProjectLibraryProps) => {
  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap flex-row justify-center gap-6">
        <ActionCard
          icon={<FolderOpenIcon className="w-10 h-10" />}
          label="Open"
          onClick={onOpen}
          variant="secondary"
        />
        {recentProjects.map((project) => (
          <RecentCard
            key={project.projectPath}
            project={project}
            onClick={() => onProjectSelect(project.projectPath)}
          />
        ))}
        <ActionCard
          icon={<BookPlusIcon className="w-10 h-10" />}
          label="New"
          onClick={onNew}
          variant="primary"
        />
      </div>
    </div>
  )
}

export default ProjectLibrary
