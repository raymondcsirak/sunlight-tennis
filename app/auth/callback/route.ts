import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AchievementService } from "@/lib/services/achievement.service";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (session?.user) {
      // Check if this is the user's first login by looking for any XP history
      const { data: xpHistory } = await supabase
        .from('xp_history')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      // If no XP history exists, this is their first login
      if (!xpHistory?.length) {
        const achievementService = new AchievementService();
        await achievementService.checkFirstLoginAchievement(session.user.id);
      }
    }
  }

  // Use the site URL for redirects in production
  const baseUrl = siteUrl || requestUrl.origin;

  if (redirectTo) {
    return NextResponse.redirect(`${baseUrl}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${baseUrl}/profile`);
}
