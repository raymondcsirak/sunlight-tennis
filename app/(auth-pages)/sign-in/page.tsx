import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10">
      <div className="w-[350px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link className="font-medium text-primary underline underline-offset-4 hover:text-primary/90" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              name="email" 
              placeholder="you@example.com" 
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                className="text-sm text-muted-foreground underline-offset-4 hover:text-primary"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              placeholder="Your password"
              required
            />
          </div>
          <SubmitButton 
            className="w-full"
            pendingText="Signing in..." 
            formAction={signInAction}
          >
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}
