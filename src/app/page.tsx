import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  Code2,
  Database,
  Globe,
  Shield,
  Terminal,
  Zap
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">MockAPI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/docs"
              className="hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:underline underline-offset-4 hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Button className="rounded-full px-6">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-40 blur-[100px]"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              MockAPI v1.0 is now live
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto text-balance">
              Mock APIs instantly. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Build faster.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              The ultimate mock API generator for modern developers. Design
              schemas visually, test in real-time, and ship your frontend
              without waiting for the backend.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base w-full sm:w-auto group"
              >
                <Link href="/dashboard">
                  Start Mocking for Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base w-full sm:w-auto"
              >
                <Link href="https://github.com" target="_blank">
                  <Globe className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>
            </div>

            {/* Terminal Mockup */}
            <div className="mt-16 md:mt-24 max-w-5xl mx-auto relative group perspective">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative rounded-xl border bg-black/90 shadow-2xl overflow-hidden flex flex-col text-left">
                <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto flex items-center text-xs text-muted-foreground font-mono">
                    <Terminal className="w-3 h-3 mr-2" />
                    GET /api/mock/v1/users
                  </div>
                </div>
                <div className="p-6 font-mono text-sm text-blue-300 overflow-x-auto">
                  <span className="text-pink-400">fetch</span>(
                  <span className="text-green-300">
                    'https://mockapi.dev/api/mock/abc123xyz/users'
                  </span>
                  )
                  <br />
                  &nbsp;&nbsp;.<span className="text-pink-400">then</span>(res
                  =&gt; res.<span className="text-pink-400">json</span>())
                  <br />
                  &nbsp;&nbsp;.<span className="text-pink-400">then</span>(data
                  =&gt; <span className="text-pink-400">console</span>.
                  <span className="text-blue-400">log</span>(data));
                  <br />
                  <br />
                  <span className="text-zinc-500">// Response</span>
                  <br />
                  <span className="text-zinc-300">{"{"}</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-300">
                    "status"
                  </span>: <span className="text-orange-300">200</span>,
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-300">
                    "data"
                  </span>: <span className="text-zinc-300">[</span>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-zinc-300">{"{"}</span>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-blue-300">"id"</span>:{" "}
                  <span className="text-green-300">"usr_9f8e7d6c"</span>,
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-blue-300">"name"</span>:{" "}
                  <span className="text-green-300">"Alice Developer"</span>,
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-blue-300">"role"</span>:{" "}
                  <span className="text-green-300">"Admin"</span>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-zinc-300">{"}"}</span>
                  <br />
                  &nbsp;&nbsp;<span className="text-zinc-300">]</span>
                  <br />
                  <span className="text-zinc-300">{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Everything you need to mock APIs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop waiting for backend teams. Define your schemas, set up
                routes, and start integrating instantly with powerful tools
                built for front-end developers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Visual Schema Builder
                </h3>
                <p className="text-muted-foreground">
                  Design your JSON structure without writing a single line of
                  code. Support for primitive types, arrays, nested objects, and
                  faker.js integration.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Logs</h3>
                <p className="text-muted-foreground">
                  Monitor every incoming request and outgoing response
                  instantly. Filter logs by status, method, or search query to
                  debug your app faster.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Developer Playground
                </h3>
                <p className="text-muted-foreground">
                  Test your endpoints right from the dashboard. Tweak headers,
                  change body payloads, and see the exact response your app will
                  get.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Auth Simulation</h3>
                <p className="text-muted-foreground">
                  Need to test protected routes? Simulate Bearer Tokens, Basic
                  Auth, or API Keys easily and validate your frontend auth flow.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow group lg:col-span-2">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Zero Config Setup
                    </h3>
                    <p className="text-muted-foreground">
                      Just create a project and you immediately get a base URL
                      ready to accept requests. It just works out of the box,
                      with zero deployment required.
                    </p>
                  </div>
                  <div className="w-full md:w-64 h-32 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl border border-primary/20 flex items-center justify-center">
                    <span className="font-mono text-sm opacity-75 text-primary">
                      /api/mock/your-token/*
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to streamline your development?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of developers who are shipping faster by unblocking
              their frontend teams today.
            </p>
            <Button size="lg" className="rounded-full px-10 h-14 text-lg">
              <Link href="/dashboard">
                Create Your First Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                MockAPI
              </span>
            </div>

            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center md:text-left text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MockAPI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
