import { ReactNode } from 'react'
import { ProjectFragment } from '@/types'
import { BookPlusIcon } from 'lucide-react'

interface ProjectLibraryProps {
  workingRootDirectory: string | null
  projects: ProjectFragment[]
  onProjectChange: (projectPath: string) => void
}

interface ProjectCardProps {
  project: ProjectFragment | null | 'add'
  onClick: () => void
}

const ProjectCard = ({ project, onClick }: ProjectCardProps): ReactNode => {
  // Determine the background image URL
  // Use project.cover (which should be a data URL if loaded)
  // Fallback to genre-based image if no cover data URL exists
  const backgroundImageUrl = project && project !== 'add' && project.cover
    ? `url("${project.cover}")` // Use the data URL directly
    : project && project !== 'add'
      ? `url("/covers/${project.genre}.png")` // Fallback to genre image
      : ''; // No image for 'add' card initially

  return (
    <div className="relative rounded-lg shadow-md overflow-hidden transition-transform w-50 duration-300 hover:scale-105 cursor-pointer select-none" onClick={onClick}>
      <div className="relative" style={{ paddingTop: '175%' }}>
        {project === 'add' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary"> {/* Added background for add card */}
            <BookPlusIcon className="w-10 h-10 text-primary-foreground" />
            <h3 className="text-lg font-semibold text-primary-foreground ">Add Project</h3>
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: backgroundImageUrl // Use the determined URL
            }}
          // Add an onError handler for the div background might be complex,
          // rely on the selector/loading logic providing a valid URL or fallback.
          >
            <div className="p-4 absolute bottom-0 left-0 right-0 bg-neutral-50"> {/* Added slight opacity */}
              <h3 className="text-lg font-semibold text-gray-800 truncate">{project?.title}</h3> {/* Added truncate */}
              <p className="text-sm text-gray-600"> {project?.wordCountCurrent?.toLocaleString()} / {project?.wordCountTarget?.toLocaleString()} words</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ProjectLibrary = ({ projects, onProjectChange }: ProjectLibraryProps) => {
  const handleProjectSelect = (projectPath: string) => {
    onProjectChange(projectPath)
  }
  return (
    <>
      <div className="container mx-auto ">
        <div className="flex flex-wrap flex-row justify-center gap-6 ">
          {/* Filter out null projects just in case */}
          {projects.filter(p => p !== null).map((project) => (
            <ProjectCard key={project.projectPath} project={project} onClick={() => handleProjectSelect(project.projectPath)} />
          ))}
          <ProjectCard key="add" project="add" onClick={() => handleProjectSelect('add')} />
        </div>
      </div>
    </>
  )
}

export default ProjectLibrary
