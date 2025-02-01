import { fetchWeatherForecast } from '@/lib/utils/weather'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      )
    }

    const forecast = await fetchWeatherForecast(date, time)
    
    if (!forecast) {
      return NextResponse.json(
        { error: 'Could not fetch weather data' },
        { status: 404 }
      )
    }

    return NextResponse.json(forecast)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
} 