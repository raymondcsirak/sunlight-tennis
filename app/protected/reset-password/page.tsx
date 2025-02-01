import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          <SubmitButton
            className="w-full"
            formAction={resetPasswordAction}
            pendingText="Updating password..."
          >
            Update Password
          </SubmitButton>

          {searchParams && "message" in searchParams && (
            <FormMessage message={searchParams} />
          )}
        </form>
      </div>
    </div>
  );
}
