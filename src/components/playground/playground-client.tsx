"use client";

import Editor from "@monaco-editor/react";
import { Loader2, Send, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PlaygroundClient({ projects }: { projects: any[] }) {
  const { theme } = useTheme();
  const [projectId, setProjectId] = React.useState(projects[0]?.id || "");

  // Endpoints state
  const [endpoints, setEndpoints] = React.useState<any[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] =
    React.useState<string>("custom");

  const [method, setMethod] = React.useState("GET");
  const [path, setPath] = React.useState("/");
  const [body, setBody] = React.useState("{\n  \n}");
  const [headersStr, setHeadersStr] = React.useState(
    '{\n  "Content-Type": "application/json"\n}'
  );

  const [response, setResponse] = React.useState("");
  const [status, setStatus] = React.useState<number | null>(null);
  const [time, setTime] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Auth state
  const [authType, setAuthType] = React.useState("none");
  const [authBearer, setAuthBearer] = React.useState("");
  const [authBasicUser, setAuthBasicUser] = React.useState("");
  const [authBasicPass, setAuthBasicPass] = React.useState("");
  const [authApiKeyName, setAuthApiKeyName] = React.useState("x-api-key");
  const [authApiKeyValue, setAuthApiKeyValue] = React.useState("");

  const selectedProject = projects.find((p) => p.id === projectId);

  // Fetch endpoints when project changes
  React.useEffect(() => {
    if (!projectId) return;

    async function fetchEndpoints() {
      try {
        const res = await fetch(
          `/api/internal/endpoints?projectId=${projectId}`
        );
        if (res.ok) {
          const data = await res.json();
          setEndpoints(data);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchEndpoints();
  }, [projectId]);

  // Handle endpoint selection
  function handleEndpointSelect(epId: string) {
    setSelectedEndpointId(epId);
    if (epId === "custom") return;

    const ep = endpoints.find((e) => e.id === epId);
    if (ep) {
      setMethod(ep.method);
      setPath(ep.path);
      if (ep.example_request) {
        setBody(JSON.stringify(ep.example_request, null, 2));
      } else {
        setBody("{\n  \n}");
      }
    }
  }

  async function handleSend() {
    if (!selectedProject) return;

    setIsLoading(true);
    setStatus(null);
    setTime(null);
    setResponse("");

    let parsedHeaders: Record<string, string> = {};
    try {
      if (headersStr) parsedHeaders = JSON.parse(headersStr);
    } catch {
      toast.error("Invalid JSON in Headers");
      setIsLoading(false);
      return;
    }

    if (authType === "bearer" && authBearer) {
      parsedHeaders["Authorization"] = `Bearer ${authBearer}`;
    } else if (authType === "basic" && (authBasicUser || authBasicPass)) {
      parsedHeaders["Authorization"] =
        `Basic ${btoa(authBasicUser + ":" + authBasicPass)}`;
    } else if (authType === "apikey" && authApiKeyName && authApiKeyValue) {
      parsedHeaders[authApiKeyName] = authApiKeyValue;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `/api/mock/${selectedProject.public_token}${normalizedPath}`;

    const options: RequestInit = {
      method,
      headers: parsedHeaders
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = body;
    }

    const start = Date.now();
    try {
      const res = await fetch(url, options);
      const duration = Date.now() - start;

      setStatus(res.status);
      setTime(duration);

      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e: any) {
      toast.error("Request failed");
      setResponse(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyCurl() {
    if (!selectedProject) return;

    let parsedHeaders: Record<string, string> = {};
    try {
      if (headersStr) parsedHeaders = JSON.parse(headersStr);
    } catch {
      // It's ok, use empty headers or whatever is valid
    }

    if (authType === "bearer" && authBearer) {
      parsedHeaders["Authorization"] = `Bearer ${authBearer}`;
    } else if (authType === "basic" && (authBasicUser || authBasicPass)) {
      parsedHeaders["Authorization"] = `Basic ${btoa(authBasicUser + ":" + authBasicPass)}`;
    } else if (authType === "apikey" && authApiKeyName && authApiKeyValue) {
      parsedHeaders[authApiKeyName] = authApiKeyValue;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${window.location.origin}/api/mock/${selectedProject.public_token}${normalizedPath}`;

    let curlCmd = `curl -X ${method} "${url}"`;

    for (const [k, v] of Object.entries(parsedHeaders)) {
      curlCmd += ` \\\n  -H "${k}: ${v}"`;
    }

    if (["POST", "PUT", "PATCH"].includes(method) && body && body.trim() !== "") {
      const escapedBody = body.replace(/'/g, "'\\''");
      curlCmd += ` \\\n  -d '${escapedBody}'`;
    }

    navigator.clipboard.writeText(curlCmd).then(() => {
      toast.success("cURL copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy cURL");
    });
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-[calc(100vh-10rem)] border rounded-md bg-card">
      {/* Top Bar */}
      <div className="flex items-center gap-2 p-4 border-b flex-wrap">
        <Select
          value={projectId}
          onValueChange={(val) => { if (val) setProjectId(val) }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Project">
              {projects.find((p) => p.id === projectId)?.name ||
                "Select Project"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedEndpointId}
          onValueChange={(val) => { if (val) handleEndpointSelect(val) }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Custom Request">
              {selectedEndpointId === "custom"
                ? "Custom Request"
                : endpoints.find((e) => e.id === selectedEndpointId)?.name ||
                  "Custom Request"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Request</SelectItem>
            {endpoints.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-1 items-center gap-0 w-full min-w-[250px]">
          <Select value={method} onValueChange={(val) => { if (val) setMethod(val) }} disabled={isLoading}>
            <SelectTrigger className="w-[110px] rounded-r-none font-medium focus:ring-0 border-r-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].map(
                (m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-input rounded-r-md px-3 bg-background flex-1 h-10 overflow-hidden">
            <span className="text-muted-foreground whitespace-nowrap text-sm bg-muted px-2 py-0.5 rounded-sm mr-2">
              /api/mock/{selectedProject?.public_token || "{token}"}
            </span>
            <input
              className="flex-1 bg-transparent outline-none border-none focus:ring-0 text-sm w-full min-w-[100px]"
              placeholder="/users"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
          </div>
        </div>

        <Button variant="outline" onClick={handleCopyCurl} disabled={!selectedProject}>
          <Copy className="mr-2 h-4 w-4" />
          cURL
        </Button>
        <Button onClick={handleSend} disabled={isLoading || !selectedProject}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send
        </Button>
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Request Config */}
        <div className="w-full md:w-1/2 flex flex-col border-r min-h-[300px]">
          <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
            <div className="border-b px-4 py-2 bg-muted/10">
              <TabsList className="h-8">
                <TabsTrigger value="body" className="text-xs h-6">
                  Body
                </TabsTrigger>
                <TabsTrigger value="headers" className="text-xs h-6">
                  Headers
                </TabsTrigger>
                <TabsTrigger value="auth" className="text-xs h-6">
                  Auth
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="body" className="flex-1 m-0 border-0 p-0">
              <div className="h-full relative group">
                {!["POST", "PUT", "PATCH"].includes(method) && (
                  <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-sm text-muted-foreground bg-background px-4 py-2 rounded-md border shadow-sm">
                      Body is not sent with {method} requests
                    </span>
                  </div>
                )}
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  value={body}
                  onChange={(val) => setBody(val || "")}
                  options={{ minimap: { enabled: false } }}
                />
              </div>
            </TabsContent>
            <TabsContent value="headers" className="flex-1 m-0 border-0 p-0">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={headersStr}
                onChange={(val) => setHeadersStr(val || "")}
                options={{ minimap: { enabled: false } }}
              />
            </TabsContent>
            <TabsContent
              value="auth"
              className="flex-1 m-0 border-0 p-4 overflow-y-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <Label className="w-20">Type</Label>
                <Select value={authType} onValueChange={(val) => { if (val) setAuthType(val) }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="apikey">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authType === "none" && (
                <div className="text-sm text-muted-foreground italic flex h-32 items-center justify-center">
                  This request does not use any authorization.
                </div>
              )}

              {authType === "bearer" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Label className="w-20 pt-2">Token</Label>
                    <Input
                      placeholder="Token"
                      value={authBearer}
                      onChange={(e) => setAuthBearer(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {authType === "basic" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Label className="w-20 pt-2">Username</Label>
                    <Input
                      placeholder="Username"
                      value={authBasicUser}
                      onChange={(e) => setAuthBasicUser(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-start gap-4">
                    <Label className="w-20 pt-2">Password</Label>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={authBasicPass}
                      onChange={(e) => setAuthBasicPass(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {authType === "apikey" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Label className="w-20 pt-2">Key</Label>
                    <Input
                      placeholder="x-api-key"
                      value={authApiKeyName}
                      onChange={(e) => setAuthApiKeyName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-start gap-4">
                    <Label className="w-20 pt-2">Value</Label>
                    <Input
                      placeholder="Value"
                      value={authApiKeyValue}
                      onChange={(e) => setAuthApiKeyValue(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Response */}
        <div className="w-full md:w-1/2 flex flex-col bg-muted/5 min-h-[300px]">
          <div className="border-b px-4 py-2 flex items-center justify-between h-[49px]">
            <span className="text-sm font-medium">Response</span>
            {status !== null && (
              <div className="flex items-center gap-3">
                <Badge
                  variant={status >= 400 ? "destructive" : "default"}
                  className="font-mono"
                >
                  {status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {time}ms
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            {response ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={response}
                options={{ readOnly: true, minimap: { enabled: false } }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground italic">
                Hit Send to get a response
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
