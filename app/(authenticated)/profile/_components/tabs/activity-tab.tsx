"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Datele de activitate pentru heatmap
const activityData = [
  { day: "Sun", hour: 8, value: 1 },
  { day: "Sat", hour: 10, value: 1 },
  { day: "Fri", hour: 16, value: 1 },
  { day: "Thu", hour: 18, value: 1 },
  { day: "Wed", hour: 20, value: 1 },
  { day: "Tue", hour: 14, value: 1 },
  { day: "Mon", hour: 12, value: 1 },
]

// Zilele saptamanii si orele pentru afisarea pe axele heatmap-ului
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 12 }, (_, i) => (i + 8).toString()) // 8 AM to 8 PM

// Interfata pentru proprietatile componentei ActivityTab
interface ActivityTabProps {
  userId: string
}

// Componenta principala pentru tab-ul de activitate
export function ActivityTab({ userId }: ActivityTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <div className="grid grid-cols-[auto_1fr] gap-4">
              {/* Y-axis labels (days) */}
              <div className="flex flex-col justify-between text-sm text-muted-foreground pt-6">
                {days.reverse().map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="relative">
                {/* X-axis labels (hours) */}
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  {hours.map((hour) => (
                    <div key={hour}>{hour}</div>
                  ))}
                </div>
                
                {/* Activity dots */}
                <div className="grid grid-rows-7 gap-4 h-full">
                  {days.reverse().map((day) => (
                    <div key={day} className="flex justify-between">
                      {hours.map((hour) => {
                        const activity = activityData.find(
                          (d) => d.day === day && d.hour.toString() === hour
                        )
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className={`w-3 h-3 rounded-full ${
                              activity ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Structura heatmap-ului de activitate cu etichete pentru axe si puncte de activitate 