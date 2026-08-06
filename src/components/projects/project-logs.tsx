"use client";

import { clearProjectLogs } from "@/features/logs/actions";
import Editor from "@monaco-editor/react";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, Trash } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  POST: "bg-green-500/10 text-green-500 border-green-500/20",
  PUT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  PATCH: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  OPTIONS: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  HEAD: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

export function ProjectLogs({
  logs,
  projectId
}: {
  logs: any[];
  projectId: string;
}) {
  const { theme } = useTheme();
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null);
  const [isClearing, setIsClearing] = React.useState(false);

  async function handleClearLogs() {
    if (
      !confirm(
        "Are you sure you want to clear all logs? This cannot be undone."
      )
    )
      return;

    setIsClearing(true);
    const result = await clearProjectLogs(projectId);
    setIsClearing(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Logs cleared successfully");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearLogs}
          disabled={isClearing || logs.length === 0}
        >
          {isClearing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          Clear Logs
        </Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method & URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`font-mono ${methodColors[log.method] || ""}`}
                      >
                        {log.method}
                      </Badge>
                      <span
                        className="font-mono text-sm max-w-[300px] truncate"
                        title={log.url}
                      >
                        {log.url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status >= 400 ? "destructive" : "secondary"}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.duration_ms}ms
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.ip_address || "Unknown"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No logs recorded yet. Send some requests to this project's API
                  to see them here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <SheetContent className="sm:max-w-[800px] md:max-w-[900px] flex flex-col p-0 gap-0">
          <div className="p-6 border-b">
            <SheetHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant={
                    selectedLog?.status >= 400 ? "destructive" : "secondary"
                  }
                >
                  {selectedLog?.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-mono ${selectedLog ? methodColors[selectedLog.method] : ""}`}
                >
                  {selectedLog?.method}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedLog?.duration_ms}ms
                </span>
              </div>
              <SheetTitle className="font-mono text-base break-all">
                {selectedLog?.url}
              </SheetTitle>
              <SheetDescription>
                Received at{" "}
                {selectedLog &&
                  format(new Date(selectedLog.created_at), "PP pp")}
              </SheetDescription>
            </SheetHeader>
          </div>

          <Tabs
            defaultValue="headers"
            className="flex-1 flex flex-col min-h-0 bg-muted/10"
          >
            <div className="border-b px-6 py-2">
              <TabsList>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Payload</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="headers" className="flex-1 m-0 border-0 h-full">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={
                  selectedLog?.headers
                    ? JSON.stringify(selectedLog.headers, null, 2)
                    : "{\n}"
                }
                options={{ readOnly: true, minimap: { enabled: false } }}
              />
            </TabsContent>

            <TabsContent value="body" className="flex-1 m-0 border-0 h-full">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={
                  selectedLog?.body
                    ? typeof selectedLog.body === "string"
                      ? (() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(selectedLog.body),
                              null,
                              2
                            );
                          } catch {
                            return selectedLog.body;
                          }
                        })()
                      : JSON.stringify(selectedLog.body, null, 2)
                    : "No body provided"
                }
                options={{ readOnly: true, minimap: { enabled: false } }}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
