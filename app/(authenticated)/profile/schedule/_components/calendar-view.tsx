// Componenta pentru vizualizarea calendarului cu toate activitatile
// Afiseaza o vedere saptamanala cu toate evenimentele programate
// Implementeaza navigare intre zile si indicator pentru timpul curent

"use client"

import { useEffect, useState } from "react"
import { addDays, format, isSameDay, startOfDay, differenceInMinutes, parseISO } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Interfete pentru tipurile de date folosite in calendar
// Definesc structura pentru evenimente si proprietatile componentei
interface ScheduleItem {
  id: string
  type: 'court_booking' | 'training_session' | 'match'
  title: string
  start_time: string
  end_time: string
  status: string
  metadata: Record<string, any>
}

interface CalendarViewProps {
  scheduleItems: ScheduleItem[]
  userId: string
}

// Constante pentru configurarea calendarului
// Definesc intervalul orar si dimensiunile vizuale
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM
const DAYS_TO_SHOW = 5
const HOUR_HEIGHT = 80 // height of each hour slot in pixels

// Componenta principala pentru vizualizarea calendarului
// Gestioneaza:
// - Afisarea evenimentelor pe zile si ore
// - Navigarea intre perioade
// - Indicatorul de timp curent
export function CalendarView({ scheduleItems, userId }: CalendarViewProps) {
  const [startDate, setStartDate] = useState(startOfDay(new Date()))
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Navigate between days
  const handlePrevDays = () => {
    setStartDate(prev => addDays(prev, -DAYS_TO_SHOW))
  }

  const handleNextDays = () => {
    setStartDate(prev => addDays(prev, DAYS_TO_SHOW))
  }

  // Get items for a specific day
  const getItemsForDay = (date: Date) => {
    return scheduleItems.filter(item => {
      const itemStart = parseISO(item.start_time)
      return isSameDay(itemStart, date)
    })
  }

  // Calculate position and height for an event
  const getEventStyles = (item: ScheduleItem) => {
    const startTime = parseISO(item.start_time)
    const endTime = parseISO(item.end_time)
    
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
    const durationMinutes = differenceInMinutes(endTime, startTime)
    
    // Calculate position from top (relative to 8 AM)
    const topPosition = ((startMinutes - 8 * 60) / 60) * HOUR_HEIGHT
    
    // Calculate height based on duration
    const height = (durationMinutes / 60) * HOUR_HEIGHT

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      position: 'absolute' as const,
      left: '4px',
      right: '4px',
    }
  }

  return (
    <Card className="p-4">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" size="icon" onClick={handlePrevDays}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {format(startDate, 'MMM d')} - {format(addDays(startDate, DAYS_TO_SHOW - 1), 'MMM d, yyyy')}
        </div>
        <Button variant="outline" size="icon" onClick={handleNextDays}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="relative grid grid-cols-[auto,repeat(5,1fr)] gap-[1px] bg-border">
        {/* Time Labels */}
        <div className="bg-background">
          <div className="h-12" /> {/* Header spacer */}
          {HOURS.map(hour => (
            <div 
              key={hour}
              className="h-20 pr-2 text-right text-sm text-muted-foreground"
            >
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* Days */}
        {Array.from({ length: DAYS_TO_SHOW }).map((_, dayIndex) => {
          const date = addDays(startDate, dayIndex)
          const isToday = isSameDay(date, new Date())
          const dayItems = getItemsForDay(date)

          return (
            <div key={dayIndex} className="bg-background min-w-[140px]">
              {/* Day Header */}
              <div className={cn(
                "h-12 flex flex-col items-center justify-center border-b",
                isToday && "bg-primary/5"
              )}>
                <div className="text-sm font-medium">
                  {format(date, 'EEE')}
                </div>
                <div className={cn(
                  "text-sm",
                  isToday && "text-primary font-semibold"
                )}>
                  {format(date, 'd')}
                </div>
              </div>

              {/* Time Slots with Events */}
              <div className="relative">
                {/* Background Grid */}
                {HOURS.map(hour => (
                  <div 
                    key={hour}
                    className={cn(
                      "h-20 border-b border-r",
                      isToday && "bg-primary/5"
                    )}
                  />
                ))}

                {/* Events */}
                {dayItems.map(item => (
                  <div
                    key={item.id}
                    style={getEventStyles(item)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs",
                      item.type === 'court_booking' && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                      item.type === 'training_session' && "bg-green-500/20 text-green-700 dark:text-green-300",
                      item.type === 'match' && "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                    )}
                  >
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="truncate text-[10px] opacity-80">
                      {format(parseISO(item.start_time), 'h:mm a')} - {format(parseISO(item.end_time), 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Current Time Indicator */}
        {isSameDay(currentTime, startDate) && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
            style={{
              top: `${((currentTime.getHours() - 8) * HOUR_HEIGHT) + (currentTime.getMinutes() * (HOUR_HEIGHT / 60))}px`
            }}
          />
        )}
      </div>
    </Card>
  )
} 