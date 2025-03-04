import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  stages: string[]
  currentStage: string
}

function ProgressTracker({ stages, currentStage }: ProgressTrackerProps) {
  const currentStageIndex = stages.indexOf(currentStage)

  return (
    <div className="flex w-full h-4 relative rounded-full bg-primary/20 overflow-hidden">
      {stages.map((stage, index) => {
        const isActive = index <= currentStageIndex
        return (
          <div
            key={stage}
            className={cn(
              'absolute h-full transition-all',
              isActive ? 'bg-highlight-700' : 'bg-highlight/20',
              {
                'rounded-full': index === 0 || index === stages.length - 1,
              }
            )}
            style={{
              width: `${100 / stages.length}%`,
              left: `${(100 / stages.length) * index}%`,
            }}
          />
        )
      })}
    </div>
  )
}


export { ProgressTracker }
