import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Mock.<span className="text-red-500">API</span> Platform
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your mock APIs and endpoints.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
