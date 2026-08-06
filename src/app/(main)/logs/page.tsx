export const dynamic = "force-dynamic";
export const revalidate = 0;

import { LogsClient } from "@/components/logs/logs-client";
import { createClient } from "@/lib/supabase/server";
import { Activity } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LogsPage(props: {
  searchParams: Promise<{
    project?: string;
    method?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: false });

  let query = supabase
    .from("request_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (searchParams.project && searchParams.project !== 'all') {
    query = query.eq("project_id", searchParams.project);
  }
  if (searchParams.method && searchParams.method !== 'all') {
    query = query.eq("method", searchParams.method);
  }
  if (searchParams.status && searchParams.status !== 'all') {
    if (searchParams.status === '2xx') {
      query = query.gte('status', 200).lt('status', 300)
    } else if (searchParams.status === '3xx') {
      query = query.gte('status', 300).lt('status', 400)
    } else if (searchParams.status === '4xx') {
      query = query.gte('status', 400).lt('status', 500)
    } else if (searchParams.status === '5xx') {
      query = query.gte('status', 500)
    } else {
      query = query.eq('status', parseInt(searchParams.status))
    }
  }
  if (searchParams.search) {
    query = query.ilike("url", `%${searchParams.search}%`);
  }

  const page = parseInt(searchParams.page || "1") || 1;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data: logs, count } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Request Logs</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            View the latest requests made to your mock endpoints.
          </p>
        </div>
      </div>

      <LogsClient 
        logs={logs || []} 
        projects={projects || []} 
        totalCount={count || 0}
        currentPage={page}
        pageSize={limit}
        searchParams={searchParams}
      />
    </div>
  );
}
