// Type for OpenWeather API response
type WeatherResponse = {
  list: Array<{
    dt: number         
    main: {
      temp: number       
    }
    weather: Array<{
      main: string       
      icon: string       
    }>
  }>
}

// Type for weather forecast formatted for our application
export type WeatherForecast = {
  temperature: number
  condition: string
  icon: string       
  timestamp: string  
  message?: string   
}

// Function to get weather forecast for a specific date and time
export async function fetchWeatherForecast(date: string, time: string): Promise<WeatherForecast | null> {
  try {
    // Check if selected date is beyond 5 days (free API limit)
    const selectedDate = new Date(`${date}T${time}:00`)
    const fiveDaysFromNow = new Date()
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)

    if (selectedDate > fiveDaysFromNow) {
      return {
        temperature: 0,
        condition: 'unknown',
        icon: '',
        timestamp: selectedDate.toISOString(),
        message: 'No forecast available beyond 5 days'
      }
    }

    // Coordinates for Satu Mare
    const lat = 47.75
    const lon = 23
    const API_KEY = process.env.OPENWEATHER_API_KEY

    console.log('Environment variables:', {
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    })

    console.log('Weather fetch started:', { date, time, hasApiKey: !!API_KEY })

    // Check if API key is configured
    if (!API_KEY) {
      console.error('OpenWeather API key not found')
      return null
    }

    // Build API request URL
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    console.log('Fetching from URL:', url.replace(API_KEY, 'API_KEY_HIDDEN'))

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    console.log('API Response status:', response.status, response.statusText)

    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Weather API error response:', errorText)
      throw new Error(`Weather API request failed: ${response.status}`)
    }

    // Parse JSON response
    const data = await response.json() as WeatherResponse
    console.log('API Response data:', data)
    
    // Validate received data structure
    if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
      console.error('Invalid data format received:', data)
      return null
    }

    // Find forecast closest to selected date and time
    const targetTime = new Date(`${date}T${time}:00`)
    console.log('Looking for forecast closest to:', targetTime.toISOString())

    // Filter forecasts for selected date only
    const selectedDateForecasts = data.list.filter(forecast => {
      const forecastDate = new Date(forecast.dt * 1000)
      return forecastDate.toDateString() === targetTime.toDateString()
    })

    if (selectedDateForecasts.length === 0) {
      console.log('No forecasts available for selected date')
      return null
    }

    // Find forecast closest to desired time
    const closestForecast = selectedDateForecasts.reduce((prev, curr) => {
      const prevTime = new Date(prev.dt * 1000)
      const currTime = new Date(curr.dt * 1000)
      const prevDiff = Math.abs(prevTime.getHours() - targetTime.getHours())
      const currDiff = Math.abs(currTime.getHours() - targetTime.getHours())
      return prevDiff < currDiff ? prev : curr
    })

    console.log('Selected forecast:', closestForecast)

    // Format result for our application
    const result = {
      temperature: Math.round(closestForecast.main.temp),
      condition: closestForecast.weather[0].main,
      icon: closestForecast.weather[0].icon,
      timestamp: new Date(closestForecast.dt * 1000).toISOString()
    }

    console.log('Returning weather data:', result)
    return result
  } catch (error) {
    console.error('Error in fetchWeatherForecast:', error)
    return null
  }
} 