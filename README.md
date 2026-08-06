# Mock.API Platform

A robust, multi-tenant platform for generating, managing, and testing mock APIs in seconds. Designed with a sleek, modern interface and built to give front-end developers, QA engineers, and full-stack teams instant, stateful mock environments without touching real backends.

## ✨ Features

- **Dynamic Endpoints**: Create customizable endpoints by defining paths (e.g., `/users`, `/products/:id`), HTTP methods, JSON responses, and artificial network delays.
- **Stateful CRUD Operations**: Turn any endpoint into a fully functional REST API. Mock.API can automatically store and manage JSON array states, supporting `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` out of the box.
- **Request Validation**: Attach JSON Schema (Zod-based) to your endpoints. The engine will automatically validate incoming request bodies and return `400 Bad Request` with structured error messages if the payload is invalid.
- **Security & Authentication**: 
  - Protect your mock APIs using **Basic Auth**, **Bearer Tokens**, or **Custom API Keys**.
  - Configure authentication at the **Project Level** (applies to all endpoints) or override it at the **Endpoint Level**.
- **Advanced Request Logging**: 
  - Every hit to your API is recorded.
  - Filter logs by Project, Method, or Status (e.g., `2xx Success`, `4xx Error`).
  - Search by URL, view execution time, and inspect Request/Response bodies and headers.
  - Built-in pagination and bulk-delete tools.
- **Integrated Playground**: Test your APIs directly within the platform. Send requests, toggle authentication headers, and inspect responses without leaving your browser.
- **Multi-tenant Architecture**: Built with Supabase Row Level Security (RLS) to ensure that users can only view, edit, and delete their own projects and logs.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, GoTrue)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) & [Base UI](https://base-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- A Supabase Project (Free tier works perfectly)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/mock-api.git
cd mock-api
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the project and populate it with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> **Note**: The `SUPABASE_SERVICE_ROLE_KEY` is required by the API Engine to securely insert request logs by bypassing standard client restrictions on edge routes.

### 3. Setup the Database
Navigate to the Supabase SQL Editor in your dashboard and run the provided schema scripts to create tables, relationships, and RLS policies.
If you have access to the generated artifacts, execute:
1. `database_schema.sql`
2. `auth_migration.sql`
3. `logs_migration.sql`

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 How the API Engine Works

Mock.API uses a Next.js catch-all API route (`src/app/api/mock/[token]/[[...path]]/route.ts`). When a request hits `https://your-domain.com/api/mock/{project-token}/{path}`, the engine:
1. **Identifies the Project**: Validates the public token.
2. **Matches the Endpoint**: Checks the exact path or extracts path parameters (e.g., `/users/:id`).
3. **Enforces Authentication**: Evaluates Endpoint-level security first, falling back to Project-level security.
4. **Validates Payload**: If a schema is defined, validates the request body.
5. **Executes Logic**: If CRUD is enabled, it interacts with `endpoint_records`. Otherwise, it returns the static configured JSON response.
6. **Logs the Event**: Asynchronously saves the request details (duration, IP, status, body) to the `request_logs` table (unless disabled via the endpoint settings).

## 🔒 Security Notes
The API endpoints exposed via `/api/mock/...` bypass some frontend RLS because they are meant to be accessed by external clients (like Postman or a frontend app). To securely record logs, we utilize the `SUPABASE_SERVICE_ROLE_KEY` exclusively inside the secure Next.js server context.

---
*Crafted with ❤️ for developers who hate waiting for backend teams.*
