'use client'

import type { ReactNode } from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { useWizard } from '@/components/BookWizard/index'

export default function ParameterChecklist(): ReactNode {
  const { formData, currentStep } = useWizard()

  if (currentStep === 0) return null

  const checklistItems = [
    {
      label: 'Story Length',
      completed: formData.length != null,
    },
    {
      label: 'Genre',
      completed: !!formData.genre,
    },
    {
      label: 'Setting',
      completed: !!formData.setting,
    },
    {
      label: 'Title',

    },
    {
      label: 'Plot',
      completed: !!formData.plot,
    },
    {
      label: 'Writing Sample (optional)',
      completed: !!formData.writing_sample,
      optional: true,
    },
  ]

  return (
    <div className="flex flex-col gap-3 p-2">
      <h3 className="text-lg font-semibold">Checklist</h3>
      <ul className="flex flex-col gap-2">
        {checklistItems.map(item => (
          <li key={item.label} className="flex items-center gap-2">
            {item.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
            <span
              className={
                'text-sm ' +
                (item.completed ? 'text-green-700 font-medium' : 'text-gray-500') +
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
