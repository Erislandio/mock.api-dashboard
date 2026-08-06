-- ==========================================
-- Mock API Platform - Supabase Schema
-- ==========================================
-- Run this script in the Supabase SQL Editor
-- 1. Create Projects Table
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- 2. Create Endpoints Table
CREATE TABLE public.endpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD')),
    path TEXT NOT NULL, -- e.g., '/users', '/products/:id'
    status_code INTEGER DEFAULT 200 NOT NULL,
    delay_ms INTEGER DEFAULT 0 NOT NULL,
    headers JSONB DEFAULT '{}'::jsonb NOT NULL,
    response JSONB,
    schema JSONB, -- Stored Zod schema definition if applicable
    crud_enabled BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- 3. Create Endpoint Records Table (For CRUD data storage)
CREATE TABLE public.endpoint_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
    json_data TEXT NOT NULL, -- Stored as stringified JSON per requirements
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- 4. Create API Keys Table
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    last_used TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- 5. Create Request Logs Table
CREATE TABLE public.request_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES public.endpoints(id) ON DELETE SET NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    headers JSONB,
    body TEXT,
    status INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoint_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;
-- Projects: Users can only see and modify their own projects
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
-- Endpoints: Users can only access endpoints belonging to their projects
CREATE POLICY "Users can view own endpoints" ON public.endpoints FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = public.endpoints.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own endpoints" ON public.endpoints FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = public.endpoints.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own endpoints" ON public.endpoints FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = public.endpoints.project_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own endpoints" ON public.endpoints FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = public.endpoints.project_id AND user_id = auth.uid())
);
-- Endpoint Records: Users can only access records belonging to their endpoints/projects
CREATE POLICY "Users can view own records" ON public.endpoint_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.endpoints e
        JOIN public.projects p ON e.project_id = p.id
        WHERE e.id = public.endpoint_records.endpoint_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own records" ON public.endpoint_records FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.endpoints e
        JOIN public.projects p ON e.project_id = p.id
        WHERE e.id = public.endpoint_records.endpoint_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update own records" ON public.endpoint_records FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.endpoints e
        JOIN public.projects p ON e.project_id = p.id
        WHERE e.id = public.endpoint_records.endpoint_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete own records" ON public.endpoint_records FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.endpoints e
        JOIN public.projects p ON e.project_id = p.id
        WHERE e.id = public.endpoint_records.endpoint_id AND p.user_id = auth.uid()
    )
);