import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Mock.<span className="text-red-500">API</span> Platform
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account to start building your mock APIs.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
