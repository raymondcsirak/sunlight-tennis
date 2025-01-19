// Importuri necesare pentru autentificare si rutare
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Forteaza randarea dinamica deoarece avem nevoie de date de autentificare
export const dynamic = 'force-dynamic'

// Layout pentru rutele autentificate - verifica daca utilizatorul este autentificat
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initializeaza clientul Supabase cu cookie-urile curente
  const cookieStore = cookies()
  const supabase = await createClient()

  // Verifica daca exista un utilizator autentificat
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirectioneaza catre pagina de autentificare daca utilizatorul nu este logat
  if (!user) {
    redirect('/sign-in')
  }

  // Randeaza continutul pentru utilizatorii autentificati
  return children
} 