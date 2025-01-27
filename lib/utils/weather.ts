// Tipul pentru raspunsul primit de la API-ul OpenWeather
type WeatherResponse = {
  list: Array<{
    dt: number                // Timestamp Unix pentru prognoza
    main: {
      temp: number           // Temperatura in grade Celsius
    }
    weather: Array<{
      main: string          // Conditia meteo principala
      icon: string          // Codul pentru iconita vremii
    }>
  }>
}

// Tipul pentru prognoza meteo formatata pentru aplicatia noastra
export type WeatherForecast = {
  temperature: number        // Temperatura rotunjita
  condition: string         // Conditia meteo (ex: 'Rain', 'Clear', etc.)
  icon: string             // Codul iconitei pentru afisare
  timestamp: string        // Data si ora prognozei
  message?: string         // Mesaj optional pentru cazuri speciale
}

// Functie pentru obtinerea prognozei meteo pentru o data si ora specifice
export async function fetchWeatherForecast(date: string, time: string): Promise<WeatherForecast | null> {
  try {
    // Verificam daca data selectata este peste 5 zile (limita API-ului gratuit)
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

    // Coordonatele pentru Satu Mare
    const lat = 47.75
    const lon = 23
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

    console.log('Weather fetch started:', { date, time, hasApiKey: !!API_KEY })

    // Verificam daca avem cheia API configurata
    if (!API_KEY) {
      console.error('OpenWeather API key not found')
      return null
    }

    // Construim URL-ul pentru cererea API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    console.log('Fetching from URL:', url.replace(API_KEY, 'API_KEY_HIDDEN'))

    // Facem cererea catre API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    console.log('API Response status:', response.status, response.statusText)

    // Verificam daca cererea a fost cu succes
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Weather API error response:', errorText)
      throw new Error(`Weather API request failed: ${response.status}`)
    }

    // Parsam raspunsul JSON
    const data = await response.json() as WeatherResponse
    console.log('API Response data:', data)
    
    // Validam structura datelor primite
    if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
      console.error('Invalid data format received:', data)
      return null
    }

    // Cautam prognoza cea mai apropiata de data si ora selectate
    const targetTime = new Date(`${date}T${time}:00`)
    console.log('Looking for forecast closest to:', targetTime.toISOString())

    // Filtram prognozele doar pentru data selectata
    const selectedDateForecasts = data.list.filter(forecast => {
      const forecastDate = new Date(forecast.dt * 1000)
      return forecastDate.toDateString() === targetTime.toDateString()
    })

    if (selectedDateForecasts.length === 0) {
      console.log('No forecasts available for selected date')
      return null
    }

    // Gasim prognoza cea mai apropiata de ora dorita
    const closestForecast = selectedDateForecasts.reduce((prev, curr) => {
      const prevTime = new Date(prev.dt * 1000)
      const currTime = new Date(curr.dt * 1000)
      const prevDiff = Math.abs(prevTime.getHours() - targetTime.getHours())
      const currDiff = Math.abs(currTime.getHours() - targetTime.getHours())
      return prevDiff < currDiff ? prev : curr
    })

    console.log('Selected forecast:', closestForecast)

    // Formatam rezultatul pentru aplicatia noastra
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