import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
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
        <h1 className="text-2xl font-semibold tracking-tight">Creează cont</h1>
        <p className="text-sm text-muted-foreground">
          Ai deja cont?{" "}
          <Link className="text-primary hover:underline" href="/sign-in">
            Conectează-te
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
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Parolă</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        <SubmitButton 
          className="w-full" 
          formAction={signUpAction} 
          pendingText="Se creează contul..."
        >
          Creează cont
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>

      <SmtpMessage />
    </div>
  );
}
