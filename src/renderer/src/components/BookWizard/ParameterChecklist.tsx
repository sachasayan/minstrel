'use client'

import type { ReactNode } from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { useWizard } from '@/components/BookWizard/index'

export default function ParameterChecklist(): ReactNode {
  const { currentStep } = useWizard() // Removed unused formData

  if (currentStep === 0) return null

  // Checklist items now include stepNumber and completion logic based on currentStep
  const checklistItems = [
    {
      label: 'Story Length',
      stepNumber: 1,
      completed: currentStep > 1, // Completed if currentStep is past step 1
    },
    {
      label: 'Genre',
      stepNumber: 2,
      completed: currentStep > 2,
    },
    {
      label: 'Setting',
      stepNumber: 3,
      completed: currentStep > 3,
    },
    {
      label: 'Cover', // Added Cover step
      stepNumber: 4,
      completed: currentStep > 4,
    },
    {
      label: 'Title',
      stepNumber: 5,
      completed: currentStep > 5,
    },
    {
      label: 'Plot',
      stepNumber: 6,
      completed: currentStep > 6,
    },
    {
      label: 'Writing Sample (optional)',
      stepNumber: 7,
      completed: currentStep > 7, // Optional step completion still based on passing it
      optional: true,
    },
    // Summary step (step 8) is usually not shown in the checklist
  ]

  return (
    <div className="flex flex-col gap-3 p-2">
      <h3 className="text-lg font-semibold">Checklist</h3>
      <ul className="flex flex-col gap-2">
        {checklistItems.map(item => (
          <li key={item.label} className="flex items-center gap-2">
            {item.completed ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <span
              className={
                'text-sm ' +
                (item.completed ? 'text-primary font-medium' : 'text-muted-foreground') +
                (item.optional ? ' italic' : '')
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
