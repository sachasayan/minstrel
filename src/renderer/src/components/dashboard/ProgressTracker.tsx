import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  stages: string[]
  currentStage: string
}

function ProgressTracker({ stages, currentStage }: ProgressTrackerProps) {
  const currentStageIndex = stages.indexOf(currentStage)

  return (
    <div className="flex w-full h-4 relative rounded-full overflow-hidden gap-2">
      {stages.map((stage, index) => {
        const isActive = index <= currentStageIndex
        return (
          <div
            key={stage}
            className={cn(
              'h-full transition-all rounded-full w-full',
              isActive ? 'bg-highlight-700' : 'bg-primary/20',
            )}
          />
        )
      })}
    </div>
  )
}


export { ProgressTracker }
