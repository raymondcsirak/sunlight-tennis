'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Cloud, CloudSun, Sun, Thermometer, Clock, Users, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createBooking, getAvailableCourts } from '../../courts/actions'
import { useToast } from '@/components/ui/use-toast'
import { addHours, format } from 'date-fns'
import { Court } from '@/lib/schemas/court'
import type { CourtWithAvailability } from '../../courts/actions'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DURATIONS = [
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' }
]

const PLAYERS = ['1', '2', '3', '4']

export function CourtsTab() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>()
  const [duration, setDuration] = useState<string>()
  const [players, setPlayers] = useState<string>()
  const [selectedCourt, setSelectedCourt] = useState<number>()
  const [isLoading, setIsLoading] = useState(false)
  const [courts, setCourts] = useState<CourtWithAvailability[]>([])
  const [isFetchingCourts, setIsFetchingCourts] = useState(false)
  const { toast } = useToast()
  const [weatherData] = useState({
    temperature: 22,
    condition: 'Partly Cloudy',
  })
  const [isTimeConfigConfirmed, setIsTimeConfigConfirmed] = useState(false)
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false)

  useEffect(() => {
    // Initial fetch of all courts
    async function fetchInitialCourts() {
      setIsFetchingCourts(true)
      try {
        const result = await getAvailableCourts(
          format(new Date(), 'yyyy-MM-dd'),
          new Date().toISOString(),
          new Date().toISOString()
        )

        if (result.success && result.courts) {
          setCourts(result.courts)
        }
      } catch (error) {
        console.error('Error fetching initial courts:', error)
      } finally {
        setIsFetchingCourts(false)
      }
    }

    fetchInitialCourts()
  }, [])

  useEffect(() => {
    async function fetchAvailableCourts() {
      if (!date || !time || !duration) return

      setIsFetchingCourts(true)
      try {
        const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
        const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

        const result = await getAvailableCourts(
          format(date, 'yyyy-MM-dd'),
          startDateTime.toISOString(),
          endDateTime.toISOString()
        )

        if (result.success && result.courts) {
          setCourts(result.courts)
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch available courts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsFetchingCourts(false)
      }
    }

    fetchAvailableCourts()
  }, [date, time, duration, toast])

  const resetForm = () => {
    setDate(new Date())
    setTime(undefined)
    setDuration(undefined)
    setPlayers(undefined)
    setSelectedCourt(undefined)
    setIsTimeConfigConfirmed(false)
    setShowBookingConfirmation(false)
  }

  const handleBooking = async () => {
    if (!date || !time || !duration || !players || !selectedCourt) return

    setIsLoading(true)
    try {
      // Create start and end times
      const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
      const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

      const result = await createBooking({
        courtId: selectedCourt,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        players: parseInt(players),
      })

      if (result.success) {
        toast({
          title: "Booking Confirmed!",
          description: "You've earned 50 XP for booking a court.",
          className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
        })
        resetForm()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeConfigConfirm = () => {
    if (!date || !time || !duration || !players) {
      toast({
        title: "Incomplete Selection",
        description: "Please select all required fields before confirming.",
        variant: "destructive",
      })
      return
    }
    setIsTimeConfigConfirmed(true)
  }

  const handleBookingConfirm = async () => {
    setShowBookingConfirmation(false)
    await handleBooking()
  }

  return (
    <div className="animate-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card className={cn(
          "p-6 bg-gradient-to-br from-background to-muted/30 border border-border/50 shadow-lg backdrop-blur-sm",
          isTimeConfigConfirmed && "opacity-50"
        )}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            classNames={{
              months: "space-y-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center gap-1",
              caption_label: "text-sm font-medium",
              nav: "flex items-center gap-1",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
                "hover:bg-accent hover:text-accent-foreground rounded-md",
                "inline-flex items-center justify-center"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex justify-between",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2 justify-between",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50",
                "[&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-outside)]:text-muted-foreground",
                "[&:has([aria-selected].day-range-end)]:rounded-r-md"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                "inline-flex items-center justify-center"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent/50 text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </Card>

        {/* Weather and Booking Panel */}
        <Card className={cn(
          "p-6 bg-gradient-to-br from-background to-muted/30 border border-border/50 shadow-lg backdrop-blur-sm",
          isTimeConfigConfirmed && "opacity-50"
        )}>
          {date && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  {date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
              </div>

              {/* Weather Information */}
              <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <CloudSun className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5 text-primary" />
                    <span className="text-xl font-semibold">{weatherData.temperature}°C</span>
                  </div>
                  <p className="text-muted-foreground">{weatherData.condition}</p>
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Select Time
                </label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Match Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Players Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Number of Players
                </label>
                <Select value={players} onValueChange={setPlayers}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select players" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p} {p === '1' ? 'player' : 'players'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Confirm Button */}
              {!isTimeConfigConfirmed && (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={handleTimeConfigConfirm}
                  disabled={!date || !time || !duration || !players}
                >
                  Confirm Selection
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Court Selection Grid - Only show after time config is confirmed */}
      {isTimeConfigConfirmed && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Tennis Courts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courts.length > 0 ? (
              courts.map((court) => (
                <Card
                  key={court.id}
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all duration-300 group",
                    "hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02]",
                    !court.available && date && time && duration && players && "opacity-50 cursor-not-allowed",
                    selectedCourt === parseInt(court.id) && "ring-2 ring-primary shadow-lg shadow-primary/20"
                  )}
                  onClick={() => {
                    if (!date || !time || !duration || !players) {
                      toast({
                        title: "Please complete your selection",
                        description: "Select a date, time, duration and number of players first.",
                        variant: "default",
                      })
                      return
                    }
                    if (court.available) {
                      setSelectedCourt(parseInt(court.id))
                    }
                  }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 relative group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                    {court.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/courts/${court.image_url}`}
                        alt={court.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Hover overlay with quick info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                      <p className="text-sm font-medium">Surface: {court.surface}</p>
                      <p className="text-sm">{court.hourly_rate} Lei/hour</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{court.name}</h3>
                    {date && time && duration && players && (
                      <div className="flex justify-between items-center mt-2">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-sm",
                          court.available 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {court.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              // Loading state or empty state
              Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="h-6 w-2/3 bg-muted rounded" />
                    <div className="mt-2 h-4 w-1/3 bg-muted rounded" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Booking Button - Only show when a court is selected */}
      {selectedCourt && (
        <div className="mt-8 flex justify-end">
          <Button 
            size="lg"
            disabled={isLoading}
            onClick={() => setShowBookingConfirmation(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            Book Now
          </Button>
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingConfirmation} onOpenChange={setShowBookingConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Booking</DialogTitle>
            <DialogDescription>
              You are about to book {courts.find(c => parseInt(c.id) === selectedCourt)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-1 text-sm">
              <li>Date: {date?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              <li>Time: {time}</li>
              <li>Duration: {DURATIONS.find(d => d.value === duration)?.label}</li>
              <li>Players: {players}</li>
              <li className="font-medium mt-2 text-primary">
                Total Price: {(courts.find(c => parseInt(c.id) === selectedCourt)?.hourly_rate || 0) * (parseInt(duration || '0') / 60)} Lei
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBookingConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              disabled={isLoading}
              onClick={handleBookingConfirm}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 