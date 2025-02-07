// Import for HTTP responses in Next.js
import { NextResponse } from 'next/server'

// Endpoint for checking application status
// GET /api/health - Returns 'ok' status if the application is running
export async function GET() {
  return NextResponse.json({ status: 'ok' })
} 