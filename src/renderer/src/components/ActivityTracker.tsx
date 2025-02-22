import { ReactNode, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveProject } from '@/lib/store/projectsSlice'
import { format, isToday } from 'date-fns'
import { ActivityCalendar } from 'react-activity-calendar'
import { count } from 'console'

interface Calendar {
  date: string
  count: number
  level: number
}

const ActivityTracker = (): ReactNode => {
  const activeProject = useSelector(selectActiveProject)

  const [daysActivity, setDaysActivity] = useState<Calendar[]>([])
  const [lastSavedDate, setLastSavedDate] = useState<string>('')

  //Useeffect on daysActivity

  // useEffect(() => {
  //   if (activeProject) {
  //     setLastSavedDate(activeProject.lastSavedDate || '')
  //     const activityMap = activeProject.daysActivity.map((activity, index) => {

  //       const date = new Date()
  //       console.log(date)
  //       console.log(new Date(lastSavedDate).getDate())
  //       date.setDate(.getDate() - (daysActivity.length - 1) + index)

  //       const day = {
  //         date: date.toISOString().split('T')[0],
  //         count: activity ? 1 : 0,
  //         level: activity ? 1 : 0
  //       } as Calendar
  //       return day;
  //     })
  //     console.log(activityMap)
  //     setDaysActivity(activityMap)
  //   }
  // }, [activeProject])

  return (
    <div className="space-y-2">
      <div className=" grid grid-rows-7 grid-flow-col justify-start gap-1">
        {/* {!!daysActivity &&
          <ActivityCalendar
            maxLevel={2}
            data={daysActivity}
            color="highlight-500" />
        } */}

        {daysActivity.map((activity, index) => {
          const activityDate = new Date()
          activityDate.setDate(activityDate.getDate() - (daysActivity.length - 1) + index)

          return (
            <div
              key={index}
              className={`w-4 h-4 rounded-sm ${activity ? 'bg-highlight-500' : 'bg-none border-highlight-500 border-2'} cursor-pointer relative`}
              title={format(activityDate, 'MMMM do, yyyy')}
            >
              {isToday(activityDate) && <div className="absolute inset-0 bg-highlight-600 rounded-sm opacity-100 animate-ping"></div>}
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground mt-2">Last saved: {lastSavedDate ? format(new Date(lastSavedDate), 'MMMM do, yyyy') : 'Never'}</p>
    </div>
  )
}

export default ActivityTracker
