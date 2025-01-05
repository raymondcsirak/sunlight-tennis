import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [...request.cookies.getAll()].map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookieEntries) {
          cookieEntries.forEach((cookie) => {
            response.cookies.set({
              ...cookie,
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith("/profile")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (session && request.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return response;
}
