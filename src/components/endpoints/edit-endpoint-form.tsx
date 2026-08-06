'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Save, Trash } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

import { updateEndpoint, deleteEndpoint } from '@/features/endpoints/actions'

import { VisualSchemaBuilder } from '@/components/endpoints/visual-schema-builder'

// ... existing imports ...
const editEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
  status_code: z.number().int().min(100).max(599),
  delay_ms: z.number().int().min(0).max(30000),
  crud_enabled: z.boolean(),
  is_active: z.boolean(),
  enable_logs: z.boolean(),
})

type FormValues = z.infer<typeof editEndpointSchema>

export function EditEndpointForm({ endpoint, projectId }: { endpoint: any; projectId: string }) {
  const router = useRouter()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  
  const [responseJson, setResponseJson] = React.useState(() => {
    return endpoint.response ? JSON.stringify(endpoint.response, null, 2) : '{\n  "message": "Success"\n}'
  })
  
  const [schemaJson, setSchemaJson] = React.useState(() => {
    return endpoint.schema ? JSON.stringify(endpoint.schema, null, 2) : '{\n  "type": "object",\n  "properties": {}\n}'
  })
  
  const [schemaMode, setSchemaMode] = React.useState<'visual' | 'code'>('visual')

  const [exampleRequestJson, setExampleRequestJson] = React.useState(() => {
    return endpoint.example_request ? JSON.stringify(endpoint.example_request, null, 2) : '{\n  \n}'
  })

  const [authConfig, setAuthConfig] = React.useState<any>(() => {
    return endpoint.auth_config || { type: 'inherit' }
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(editEndpointSchema),
    defaultValues: {
      name: endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      status_code: endpoint.status_code,
      delay_ms: endpoint.delay_ms,
      crud_enabled: endpoint.crud_enabled,
      is_active: endpoint.is_active,
      enable_logs: endpoint.enable_logs !== false, // default true
    },
  })

  function generateExampleFromSchema() {
    try {
      const parsedSchema = JSON.parse(schemaJson)
      if (parsedSchema.type === 'object' && parsedSchema.properties) {
        const dummy: any = {}
        for (const [key, def] of Object.entries<any>(parsedSchema.properties)) {
          if (def.type === 'string') {
            if (def.format === 'email') dummy[key] = 'user@example.com'
            else if (def.format === 'uuid') dummy[key] = '123e4567-e89b-12d3-a456-426614174000'
            else if (def.format === 'date-time') dummy[key] = new Date().toISOString()
            else dummy[key] = 'sample string'
          } else if (def.type === 'number') {
            dummy[key] = 42
          } else if (def.type === 'boolean') {
            dummy[key] = true
          } else if (def.type === 'array') {
            dummy[key] = []
          } else {
            dummy[key] = null
          }
        }
        setExampleRequestJson(JSON.stringify(dummy, null, 2))
        toast.success('Generated example from schema')
      } else {
        toast.error('Schema is not a valid object with properties')
      }
    } catch (e) {
      toast.error('Invalid JSON Schema')
    }
  }

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      if (responseJson) JSON.parse(responseJson)
      if (schemaJson) JSON.parse(schemaJson)
      if (exampleRequestJson) JSON.parse(exampleRequestJson)
    } catch (e) {
      toast.error('Invalid JSON format in Response, Schema, or Example editor')
      setIsLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('endpointId', endpoint.id)
    formData.append('projectId', projectId)
    formData.append('name', data.name)
    formData.append('method', data.method)
    formData.append('path', data.path)
    formData.append('status_code', data.status_code.toString())
    formData.append('delay_ms', data.delay_ms.toString())
    formData.append('crud_enabled', data.crud_enabled.toString())
    formData.append('is_active', data.is_active.toString())
    formData.append('enable_logs', data.enable_logs.toString())
    if (responseJson) formData.append('response', responseJson)
    if (schemaJson) formData.append('schema', schemaJson)
    if (exampleRequestJson) formData.append('example_request', exampleRequestJson)
    if (authConfig) formData.append('auth_config', JSON.stringify(authConfig))

    const result = await updateEndpoint(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Endpoint saved successfully')
    }
    setIsLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this endpoint?')) return
    
    setIsDeleting(true)
    const result = await deleteEndpoint(endpoint.id, projectId)
    if (result?.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('Endpoint deleted')
      router.push(`/projects/${projectId}`)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{form.watch('name')}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span className="font-mono bg-muted px-1.5 rounded">{form.watch('method')}</span>
            <span className="font-mono">{form.watch('path')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
            Delete
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit flex-shrink-0">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="response">Response JSON</TabsTrigger>
          {form.watch('method') !== 'GET' && (
            <>
              <TabsTrigger value="schema">Validation Schema</TabsTrigger>
              <TabsTrigger value="example">Request Example</TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="settings" className="flex-1 overflow-auto mt-4">
          <Card>
            <CardContent className="pt-6">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" {...form.register('name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="path">Path</Label>
                    <Input id="path" {...form.register('path')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <Select
                      onValueChange={(val) => form.setValue('method', val as any)}
                      defaultValue={form.getValues('method')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_code">Status Code</Label>
                    <Input id="status_code" type="number" {...form.register('status_code', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delay_ms">Delay (ms)</Label>
                    <Input id="delay_ms" type="number" {...form.register('delay_ms', { valueAsNumber: true })} />
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable this endpoint without deleting it.
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('is_active')}
                      onCheckedChange={(checked) => form.setValue('is_active', checked)}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">CRUD Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically mock Create, Read, Update, and Delete operations for this endpoint.
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('crud_enabled')}
                      onCheckedChange={(checked) => form.setValue('crud_enabled', checked)}
                    />
                  </div>
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Save Logs</Label>
                      <p className="text-sm text-muted-foreground">
                        Record all requests to this endpoint in the project logs.
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('enable_logs')}
                      onCheckedChange={(checked) => form.setValue('enable_logs', checked)}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="flex-1 overflow-auto mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Authentication Override</Label>
                  <Select 
                    value={authConfig.type} 
                    onValueChange={(val) => setAuthConfig({ ...authConfig, type: val })}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit from Project (Default)</SelectItem>
                      <SelectItem value="none">None (Public)</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="apikey">API Key (Custom Header)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose whether this endpoint should inherit the project's authentication settings or override them.
                  </p>
                </div>

                {authConfig.type === 'bearer' && (
                  <div className="space-y-2 max-w-md border-l-2 pl-4 ml-1">
                    <Label>Required Bearer Token</Label>
                    <Input 
                      placeholder="e.g. sk_live_12345" 
                      value={authConfig.token || ''}
                      onChange={e => setAuthConfig({ ...authConfig, token: e.target.value })}
                    />
                  </div>
                )}

                {authConfig.type === 'basic' && (
                  <div className="space-y-4 max-w-md border-l-2 pl-4 ml-1">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input 
                        value={authConfig.username || ''}
                        onChange={e => setAuthConfig({ ...authConfig, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input 
                        type="password"
                        value={authConfig.password || ''}
                        onChange={e => setAuthConfig({ ...authConfig, password: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {authConfig.type === 'apikey' && (
                  <div className="space-y-4 max-w-md border-l-2 pl-4 ml-1">
                    <div className="space-y-2">
                      <Label>Header Name</Label>
                      <Input 
                        placeholder="x-api-key"
                        value={authConfig.keyName || ''}
                        onChange={e => setAuthConfig({ ...authConfig, keyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expected Value</Label>
                      <Input 
                        placeholder="secret-value"
                        value={authConfig.keyValue || ''}
                        onChange={e => setAuthConfig({ ...authConfig, keyValue: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="response" className="flex-1 mt-4 rounded-md border overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={responseJson}
            onChange={(val) => setResponseJson(val || '')}
            options={{
              minimap: { enabled: false },
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </TabsContent>

        {form.watch('method') !== 'GET' && (
          <>
            <TabsContent value="schema" className="flex-1 mt-4 rounded-md border overflow-hidden bg-background">
              <div className="flex flex-col h-full overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-medium">JSON Validation Schema</h3>
                    <p className="text-sm text-muted-foreground">
                      Define the schema to validate incoming POST/PUT request bodies.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                    <Button 
                      size="sm" 
                      variant={schemaMode === 'visual' ? 'secondary' : 'ghost'} 
                      onClick={() => setSchemaMode('visual')}
                    >
                      Visual
                    </Button>
                    <Button 
                      size="sm" 
                      variant={schemaMode === 'code' ? 'secondary' : 'ghost'} 
                      onClick={() => setSchemaMode('code')}
                    >
                      Code
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  {schemaMode === 'visual' ? (
                    <VisualSchemaBuilder value={schemaJson} onChange={setSchemaJson} />
                  ) : (
                    <div className="h-full border rounded-md overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        value={schemaJson}
                        onChange={(val) => setSchemaJson(val || '')}
                        options={{
                          minimap: { enabled: false },
                          formatOnPaste: true,
                          formatOnType: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="example" className="flex-1 mt-4 rounded-md border overflow-hidden bg-background">
              <div className="flex flex-col h-full overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="font-medium">Example Request Payload</h3>
                    <p className="text-sm text-muted-foreground">
                      Define an example payload. This will be pre-filled in the Playground.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={generateExampleFromSchema}>
                    Generate from Schema
                  </Button>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={exampleRequestJson}
                    onChange={(val) => setExampleRequestJson(val || '')}
                    options={{
                      minimap: { enabled: false },
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
