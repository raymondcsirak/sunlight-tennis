// Import pentru raspunsuri HTTP in Next.js
import { NextResponse } from 'next/server'

// Endpoint pentru verificarea starii aplicatiei
// GET /api/health - Returneaza status 'ok' daca aplicatia functioneaza
export async function GET() {
  return NextResponse.json({ status: 'ok' })
} 