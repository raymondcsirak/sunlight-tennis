"use client"

import { useEffect, useState } from "react"
import { addDays, format, isSameDay, startOfDay } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM
const DAYS_TO_SHOW = 5

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

  // Get items for a specific day and hour
  const getItemsForTimeSlot = (date: Date, hour: number) => {
    return scheduleItems.filter(item => {
      const itemStart = new Date(item.start_time)
      return (
        isSameDay(itemStart, date) && 
        itemStart.getHours() === hour
      )
    })
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

              {/* Time Slots */}
              {HOURS.map(hour => {
                const items = getItemsForTimeSlot(date, hour)
                return (
                  <div 
                    key={hour}
                    className={cn(
                      "h-20 border-b border-r p-1",
                      isToday && "bg-primary/5"
                    )}
                  >
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          "text-xs p-1 rounded mb-1 truncate",
                          item.type === 'court_booking' && "bg-blue-500/10 text-blue-500",
                          item.type === 'training_session' && "bg-green-500/10 text-green-500",
                          item.type === 'match' && "bg-orange-500/10 text-orange-500"
                        )}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Current Time Indicator */}
        {isSameDay(currentTime, startDate) && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
            style={{
              top: `${((currentTime.getHours() - 8) * 80) + (currentTime.getMinutes() * (80 / 60))}px`
            }}
          />
        )}
      </div>
    </Card>
  )
} 