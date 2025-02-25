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
  return (
    <div className="relative  rounded-lg shadow-md overflow-hidden transition-transform w-50 duration-300 hover:scale-105 cursor-pointer select-none" onClick={onClick}>
      <div className="relative" style={{ paddingTop: '175%' }}>
        {project === 'add' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <BookPlusIcon className="w-10 h-10 text-gray-800" />
            <h3 className="text-lg font-semibold text-gray-800 ">Add Project</h3>
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: !project?.cover ? `url("/covers/${project?.genre}.png")` : `url("/book-cover.png")`
            }}
          >
            <div className="p-4 absolute bottom-0 left-0 right-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800 ">{project?.title}</h3>
              <p className="text-sm text-gray-600">100,000 words</p>
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
          {projects.map((project) => (
            <ProjectCard key={project.projectPath} project={project} onClick={() => handleProjectSelect(project.projectPath)} />
          ))}
          <ProjectCard key="add" project="add" onClick={() => handleProjectSelect('add')} />
        </div>
      </div>
    </>
  )
}

export default ProjectLibrary
