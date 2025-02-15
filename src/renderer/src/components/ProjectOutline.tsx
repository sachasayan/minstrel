// import { useSelector } from 'react-redux';
// import { selectAppState } from '@/lib/utils/appStateSlice';
// import { ChapterOutline } from '@/types';
import { KanbanBoard } from './KanbanBoard'

export default function ProjectOutline() {
  // const appState = useSelector(selectAppState);
  // const activeProject = appState.activeProject; // Access activeProject
  // const outline = activeProject?.files.filter((file) => file.title.startsWith('Outline')) || []; // Access outline from activeProject

  return (
    <div className="container mx-auto p-4 space-y-6">
      <KanbanBoard />
    </div>
  )
}
