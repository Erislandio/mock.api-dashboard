export const dynamic = "force-dynamic";
export const revalidate = 0;

import { LogsTable } from "@/components/logs/logs-table";
import { createClient } from "@/lib/supabase/server";
import { Activity } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LogsPage(props: {
  searchParams: Promise<{ project?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Ensure authenticated
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get Projects for the filter
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: false });

  let query = supabase
    .from("request_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.project) {
    query = query.eq("project_id", searchParams.project);
  }

  const { data: logs } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Request Logs</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            View the latest 100 requests made to your mock endpoints.
          </p>
        </div>
      </div>

      <LogsTable logs={logs || []} />
    </div>
  );
}
