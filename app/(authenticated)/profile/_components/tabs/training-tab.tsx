"use client"

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Cloud, CloudSun, Sun, Thermometer, Clock, Users, CalendarIcon, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createTrainingSession, getAvailableCoaches } from '@/app/(authenticated)/profile/training/actions'
import { useToast } from '@/components/ui/use-toast'
import { addHours, format } from 'date-fns'
import type { CoachWithAvailability } from '../../training/actions'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchWeatherForecast, type WeatherForecast } from '@/lib/utils/weather'

// Constante pentru orele disponibile si durate
const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DURATIONS = [
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' }
]

// Componenta principala pentru tab-ul de antrenament
export function TrainingTab() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>()
  const [duration, setDuration] = useState<string>()
  const [selectedCoach, setSelectedCoach] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [coaches, setCoaches] = useState<CoachWithAvailability[]>([])
  const [isFetchingCoaches, setIsFetchingCoaches] = useState(false)
  const { toast } = useToast()
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [isTimeConfigConfirmed, setIsTimeConfigConfirmed] = useState(false)
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false)

  // Hook pentru incarcarea initiala a antrenorilor disponibili
  useEffect(() => {
    // Initial fetch of all coaches
    async function fetchInitialCoaches() {
      setIsFetchingCoaches(true)
      try {
        const result = await getAvailableCoaches(
          format(new Date(), 'yyyy-MM-dd'),
          new Date().toISOString(),
          new Date().toISOString()
        )

        if (result.success && result.coaches) {
          setCoaches(result.coaches)
        }
      } catch (error) {
        console.error('Error fetching initial coaches:', error)
      } finally {
        setIsFetchingCoaches(false)
      }
    }

    fetchInitialCoaches()
  }, [])

  // Hook pentru incarcarea antrenorilor disponibili in functie de data si ora
  useEffect(() => {
    async function fetchAvailableCoaches() {
      if (!date || !time || !duration) return

      setIsFetchingCoaches(true)
      try {
        const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
        const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

        const result = await getAvailableCoaches(
          format(date, 'yyyy-MM-dd'),
          startDateTime.toISOString(),
          endDateTime.toISOString()
        )

        if (result.success && result.coaches) {
          setCoaches(result.coaches)
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch available coaches. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsFetchingCoaches(false)
      }
    }

    fetchAvailableCoaches()
  }, [date, time, duration, toast])

  // Hook pentru incarcarea prognozei meteo
  useEffect(() => {
    async function fetchWeather() {
      if (!date || !time) {
        return
      }
      
      setIsLoadingWeather(true)
      try {
        const forecast = await fetchWeatherForecast(
          format(date, 'yyyy-MM-dd'),
          time
        )

        if (forecast) {
          setWeatherData(forecast)
        } else {
          toast({
            title: "Weather Data Unavailable",
            description: "Could not fetch weather data for the selected time.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching weather:', error)
        toast({
          title: "Weather Update Failed",
          description: "Unable to fetch weather data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingWeather(false)
      }
    }

    // Only fetch if both date and time are selected
    if (date && time) {
      fetchWeather()
    }
  }, [date, time, toast])

  // Functie pentru obtinerea iconitei corespunzatoare conditiilor meteo
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-8 w-8" />
      case 'clouds':
        return <Cloud className="h-8 w-8" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-8 w-8" />
      case 'snow':
        return <CloudSnow className="h-8 w-8" />
      case 'thunderstorm':
        return <CloudLightning className="h-8 w-8" />
      case 'mist':
      case 'fog':
        return <Wind className="h-8 w-8" />
      default:
        return <CloudSun className="h-8 w-8" />
    }
  }

  // Functie pentru resetarea formularului de rezervare
  const resetForm = () => {
    setDate(new Date())
    setTime(undefined)
    setDuration(undefined)
    setSelectedCoach(undefined)
    setIsTimeConfigConfirmed(false)
    setShowBookingConfirmation(false)
  }

  // Functie pentru gestionarea rezervarii
  const handleBooking = async () => {
    if (!date || !time || !duration || !selectedCoach) return

    setIsLoading(true)
    try {
      // Create start and end times
      const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
      const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

      const result = await createTrainingSession({
        coachId: selectedCoach,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      })

      if (result.success) {
        toast({
          title: "Training Session Booked!",
          description: "You've earned 100 XP for booking a training session.",
          className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
        })
        resetForm()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your training session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Functie pentru confirmarea configurarii timpului
  const handleTimeConfigConfirm = () => {
    if (!date || !time || !duration) {
      toast({
        title: "Incomplete Selection",
        description: "Please select all required fields before confirming.",
        variant: "destructive",
      })
      return
    }
    setIsTimeConfigConfirmed(true)
  }

  // Functie pentru confirmarea rezervarii
  const handleBookingConfirm = async () => {
    setShowBookingConfirmation(false)
    await handleBooking()
  }

  // Functie pentru selectarea antrenorului
  const handleCoachSelect = (coachId: string) => {
    setSelectedCoach(coachId)
    setShowBookingConfirmation(true)
  }

  return (
    <div className="animate-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sectiunea de calendar */}
        <Card 
          className="p-6 bg-gradient-to-br from-background to-muted/30 border border-border/50 shadow-lg backdrop-blur-sm"
        >
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

        {/* Sectiunea de afisare a informatiilor meteo si a formularului de rezervare */}
        <Card 
          className="p-6 bg-gradient-to-br from-background to-muted/30 border border-border/50 shadow-lg backdrop-blur-sm"
        >
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
                  {isLoadingWeather ? (
                    <Spinner className="h-8 w-8" />
                  ) : weatherData ? (
                    weatherData.message ? (
                      <CloudSun className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      getWeatherIcon(weatherData.condition)
                    )
                  ) : (
                    <CloudSun className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5 text-primary" />
                    <span className="text-xl font-semibold">
                      {isLoadingWeather ? (
                        <span className="animate-pulse">--</span>
                      ) : weatherData ? (
                        weatherData.message ? (
                          '--°C'
                        ) : (
                          `${weatherData.temperature}°C`
                        )
                      ) : (
                        '--°C'
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {isLoadingWeather ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : weatherData ? (
                      weatherData.message || weatherData.condition
                    ) : (
                      'Weather data unavailable'
                    )}
                  </p>
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
                <label className="text-sm font-medium">Session Duration</label>
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

              {/* Confirm Button - Only show when not confirmed */}
              {!isTimeConfigConfirmed && (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={handleTimeConfigConfirm}
                  disabled={!date || !time || !duration}
                >
                  Confirm Selection
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Coaches Grid - Only show after time config is confirmed */}
      {isTimeConfigConfirmed && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Available Coaches</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.length > 0 ? (
              coaches.map((coach) => (
                <Card
                  key={coach.id}
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all duration-300 group",
                    "hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02]",
                    !coach.available && date && time && duration && "opacity-50 cursor-not-allowed",
                    selectedCoach === coach.id && "ring-2 ring-primary shadow-lg shadow-primary/20"
                  )}
                  onClick={() => {
                    if (!date || !time || !duration) {
                      toast({
                        title: "Please complete your selection",
                        description: "Select a date, time, and duration first.",
                        variant: "default",
                      })
                      return
                    }
                    if (coach.available) {
                      handleCoachSelect(coach.id)
                    }
                  }}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/5 to-primary/10 relative group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                    {coach.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={coach.image_url}
                        alt={coach.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Hover overlay with quick info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                      <p className="text-sm font-medium">Role: {coach.role}</p>
                      <p className="text-sm">{coach.specialization}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-lg font-semibold">{coach.name}</h3>
                    {date && time && duration && (
                      <div className="flex justify-between items-center mt-2">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-sm",
                          coach.available 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {coach.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              // Loading state or empty state
              Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground/20" />
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

      {/* Booking Button - Only show when a coach is selected */}
      {selectedCoach && (
        <div className="mt-4 flex justify-end">
          <Button 
            size="lg"
            disabled={isLoading}
            onClick={() => setShowBookingConfirmation(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            Book Session
          </Button>
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingConfirmation} onOpenChange={setShowBookingConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Training Session</DialogTitle>
            <DialogDescription>
              Please review your training session details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {date?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {time} ({duration === '60' ? '1 hour' : '2 hours'})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Coach</p>
                <p className="text-sm text-muted-foreground">
                  {coaches.find(c => c.id === selectedCoach)?.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">
                  {coaches.find(c => c.id === selectedCoach)?.role}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookingConfirm} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 