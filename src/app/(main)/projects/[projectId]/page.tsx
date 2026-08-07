export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";

import { ChevronRight, ExternalLink, Play, Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteEndpointButton } from "@/components/endpoints/delete-endpoint-button";
import { notFound } from "next/navigation";

import { CreateEndpointDialog } from "@/components/endpoints/create-endpoint-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { ProjectLogs } from "@/components/projects/project-logs";
import { ProjectSettings } from "@/components/projects/project-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  POST: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  PUT: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  PATCH: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  OPTIONS: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  HEAD: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
};

export default async function ProjectPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .single();

  if (!project) notFound();

  const { data: endpoints } = await supabase
    .from("endpoints")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const { data: logs } = await supabase
    .from("request_logs")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{project.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1">
            {project.description || "Manage endpoints for this project."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={
              <Link href="/playground" className="flex items-center gap-2" />
            }
          >
            <ExternalLink className="h-4 w-4" />
            Test in Playground
          </Button>
          <CreateEndpointDialog projectId={project.id} />
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Delay (ms)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints && endpoints.length > 0 ? (
                  endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{endpoint.name}</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={`font-mono ${methodColors[endpoint.method] || ""}`}
                            >
                              {endpoint.method}
                            </Badge>
                            <span className="font-mono">{endpoint.path}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            endpoint.status_code >= 400
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {endpoint.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell>{endpoint.delay_ms}ms</TableCell>
                      <TableCell>
                        {endpoint.is_active ? (
                          <Badge
                            variant="outline"
                            className="border-green-500/50 text-green-500"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-muted text-muted-foreground"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/projects/${project.id}/endpoints/${endpoint.id}`}
                              className="flex items-center gap-2"
                            />
                          }
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/playground?endpoint=${endpoint.id}`}
                              className="flex items-center gap-2"
                            />
                          }
                        >
                          <Play className="h-4 w-4" />
                          Test
                        </Button>
                        <DeleteEndpointButton endpointId={endpoint.id} projectId={project.id} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No endpoints found for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <ProjectLogs logs={logs || []} projectId={project.id} />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
