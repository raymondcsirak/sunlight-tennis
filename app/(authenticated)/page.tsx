// Importuri necesare pentru rutare
import { redirect } from "next/navigation"

// Pagina principala - redirectioneaza catre profilul utilizatorului
export default function HomePage() {
  redirect("/profile")
} 