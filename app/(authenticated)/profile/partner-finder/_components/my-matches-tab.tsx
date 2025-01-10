"use client"

import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { addHours, format } from 'date-fns'
import { Cloud, CloudSun, Sun, Thermometer, Clock, Users, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchWeatherForecast, type WeatherForecast } from '@/lib/utils/weather'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MatchResponses } from "./match-responses"

interface MyMatchesTabProps {
  userId: string
}

type RequestFilter = 'all' | 'open' | 'accepted' | 'rejected'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'open', label: 'Open Requests' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
] as const

const AVAILABLE_TIMES = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DURATIONS = [
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' }
]

interface MatchRequest {
  id: string
  creator_id: string
  preferred_date: string
  preferred_time: string
  duration: string
  court_preference: string
  status: 'open' | 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  court?: Court
  responses?: Array<{
    id: string
    status: 'pending' | 'accepted' | 'rejected'
    responder: {
      id: string
      full_name: string
      avatar_url: string | null
      level: number
      matches_won: number
    }
  }>
}

interface Court {
  id: string
  name: string
  surface: string
  is_indoor: boolean
}

export function MyMatchesTab({ userId }: MyMatchesTabProps) {
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>()
  const [duration, setDuration] = useState<string>()
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [filter, setFilter] = useState<RequestFilter>('all')

  useEffect(() => {
    fetchMatchRequests()
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name')

      if (error) throw error
      setCourts(data)
    } catch (error) {
      console.error('Error fetching courts:', error)
      toast({
        title: "Error",
        description: "Failed to load courts. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchMatchRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('match_requests')
        .select(`
          *,
          court:courts(
            name,
            surface,
            is_indoor
          ),
          responses:match_request_responses(
            id,
            status,
            responder:profiles(
              id,
              full_name,
              avatar_url,
              level,
              matches_won
            )
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMatchRequests(requestsData)
    } catch (error) {
      console.error('Error fetching match requests:', error)
      toast({
        title: "Error",
        description: "Failed to load match requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch weather when date or time changes
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

    if (date && time) {
      fetchWeather()
    }
  }, [date, time, toast])

  const handleCreateRequest = async () => {
    if (!date || !time || !duration || !selectedCourt) return

    setIsLoading(true)
    try {
      const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`)
      const endDateTime = addHours(startDateTime, parseInt(duration) / 60)

      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          creator_id: userId,
          preferred_date: format(date, 'yyyy-MM-dd'),
          preferred_time: time,
          duration: `${duration} minutes`,
          court_preference: selectedCourt,
          status: 'open',
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Request Created!",
        description: "Your match request has been created successfully.",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })
      setShowNewRequest(false)
      fetchMatchRequests()
    } catch (error) {
      console.error('Error creating match request:', error)
      toast({
        title: "Error",
        description: "Failed to create match request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDate(new Date())
    setTime(undefined)
    setDuration(undefined)
    setSelectedCourt(undefined)
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('match_requests')
        .delete()
        .eq('id', requestId)
        .eq('creator_id', userId) // Extra safety check

      if (error) throw error

      toast({
        title: "Request Cancelled",
        description: "Your match request has been cancelled successfully.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })
      
      // Update the local state by removing the cancelled request
      setMatchRequests(prev => prev.filter(request => request.id !== requestId))
    } catch (error) {
      console.error('Error cancelling match request:', error)
      toast({
        title: "Error",
        description: "Failed to cancel match request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptResponse = async (responseId: string) => {
    try {
      // Get the response details first
      const { data: responseData, error: responseError } = await supabase
        .from('match_request_responses')
        .select('*, request:match_requests(*)')
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Update the response status
      const { error: updateError } = await supabase
        .from('match_request_responses')
        .update({ status: 'accepted' })
        .eq('id', responseId)

      if (updateError) throw updateError

      // Create a notification for the responder
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: responseData.responder_id,
          type: 'match_request_accepted',
          title: 'Match Request Accepted',
          message: 'Your match request has been accepted! Get ready to play!',
          data: {
            request_id: responseData.request_id,
            response_id: responseId
          }
        })

      if (notificationError) throw notificationError

      toast({
        title: "Response Accepted",
        description: "The player will be notified. Get ready to play!",
        className: "bg-gradient-to-br from-green-500/90 to-green-600/90 text-white border-none",
      })

      // Refresh the requests list
      fetchMatchRequests()
    } catch (error) {
      console.error('Error accepting response:', error)
      toast({
        title: "Error",
        description: "Failed to accept response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectResponse = async (responseId: string) => {
    try {
      // Get the response details first
      const { data: responseData, error: responseError } = await supabase
        .from('match_request_responses')
        .select('*, request:match_requests(*)')
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Update the response status
      const { error: updateError } = await supabase
        .from('match_request_responses')
        .update({ status: 'rejected' })
        .eq('id', responseId)

      if (updateError) throw updateError

      // Create a notification for the responder
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: responseData.responder_id,
          type: 'match_request_rejected',
          title: 'Match Request Response',
          message: 'Unfortunately, your match request was not accepted.',
          data: {
            request_id: responseData.request_id,
            response_id: responseId
          }
        })

      if (notificationError) throw notificationError

      toast({
        title: "Response Rejected",
        description: "The player has been notified.",
        className: "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-none",
      })

      // Refresh the requests list
      fetchMatchRequests()
    } catch (error) {
      console.error('Error rejecting response:', error)
      toast({
        title: "Error",
        description: "Failed to reject response. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Sort and filter match requests
  const sortedAndFilteredRequests = useMemo(() => {
    let filtered = [...matchRequests]

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => {
        if (filter === 'open') {
          return request.status === 'open' && (!request.responses || request.responses.every(r => r.status === 'rejected'))
        }
        if (filter === 'accepted') {
          return request.responses?.some(r => r.status === 'accepted')
        }
        if (filter === 'rejected') {
          return request.responses?.every(r => r.status === 'rejected')
        }
        return true
      })
    }

    // Sort by response status and date
    return filtered.sort((a, b) => {
      // Helper function to get request priority
      const getPriority = (request: MatchRequest) => {
        if (request.responses?.some(r => r.status === 'accepted')) return 0 // Highest priority
        if (request.responses?.some(r => r.status === 'pending')) return 1
        if (!request.responses || request.responses.length === 0) return 2 // Open requests with no responses
        if (request.responses?.every(r => r.status === 'rejected')) return 3
        return 2 // Default case
      }

      const priorityA = getPriority(a)
      const priorityB = getPriority(b)

      // First sort by priority
      if (priorityA !== priorityB) return priorityA - priorityB

      // For same priority, sort by date (newest first)
      const aDateTime = new Date(a.preferred_date + ' ' + a.preferred_time).getTime()
      const bDateTime = new Date(b.preferred_date + ' ' + b.preferred_time).getTime()
      return bDateTime - aDateTime
    })
  }, [matchRequests, filter])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Match Requests</h2>
        <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create Match Request</DialogTitle>
              <DialogDescription>
                Select your preferred date, time, and court for the match.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <Card className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </Card>

              {/* Time, Weather, and Court Selection */}
              <Card className="p-4">
                {date && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                    </div>

                    {/* Weather Information */}
                    {weatherData && (
                      <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Sun className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-primary" />
                            <span className="font-medium">{weatherData.temperature}°C</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{weatherData.condition}</p>
                        </div>
                      </div>
                    )}

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
                      <label className="text-sm font-medium">Duration</label>
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

                    {/* Court Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferred Court</label>
                      <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select court" />
                        </SelectTrigger>
                        <SelectContent>
                          {courts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name} ({court.surface}, {court.is_indoor ? 'Indoor' : 'Outdoor'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm()
                setShowNewRequest(false)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRequest} 
                disabled={isLoading || !date || !time || !duration || !selectedCourt}
              >
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="w-[200px]">
          <Select value={filter} onValueChange={(value) => setFilter(value as RequestFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter requests" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAndFilteredRequests.length} {sortedAndFilteredRequests.length === 1 ? 'request' : 'requests'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndFilteredRequests.map((request) => (
          <div key={request.id} className="space-y-4">
            <Card 
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 hover:bg-gradient-to-br from-background to-muted/50"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <CardTitle className="text-base">
                      {format(new Date(request.preferred_date), 'MMM d')} at {request.preferred_time}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {request.court?.name}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={request.status === "confirmed" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{request.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {request.court?.is_indoor ? (
                        <Cloud className="h-3.5 w-3.5" />
                      ) : (
                        <Sun className="h-3.5 w-3.5" />
                      )}
                      <span>{request.court?.surface}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-destructive/90 hover:text-destructive-foreground"
                        >
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Match Request</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this match request? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Request</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelRequest(request.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Cancel Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Show responses if there are any */}
            {request.responses && request.responses.length > 0 && (
              <MatchResponses
                responses={request.responses}
                onAccept={handleAcceptResponse}
                onReject={handleRejectResponse}
              />
            )}
          </div>
        ))}

        {sortedAndFilteredRequests.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No match requests found for the selected filter.
          </div>
        )}
      </div>
    </div>
  )
} 