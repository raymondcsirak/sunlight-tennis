import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function ForgotPassword(props: {
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
        <h1 className="text-2xl font-semibold tracking-tight">Resetare parolă</h1>
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
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            required 
          />
        </div>

        <SubmitButton 
          className="w-full" 
          formAction={forgotPasswordAction}
          pendingText="Se trimite..."
        >
          Trimite email de resetare
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>

      <SmtpMessage />
    </div>
  );
}
