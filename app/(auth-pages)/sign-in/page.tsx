import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex items-center justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Conectare</h1>
        <p className="text-sm text-muted-foreground">
          Nu ai cont?{" "}
          <Link className="text-primary hover:underline" href="/sign-up">
            Creează cont
          </Link>
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email" 
            type="email"
            placeholder="you@example.com" 
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            required 
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Parolă</Label>
            <Link
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
              href="/forgot-password"
            >
              Ai uitat parola?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            placeholder="••••••••"
            required
          />
        </div>

        <SubmitButton 
          className="w-full" 
          formAction={signInAction} 
          pendingText="Se conectează..."
        >
          Conectare
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </div>
  );
}
