'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProjectAuth } from '@/features/projects/actions'

export function ProjectSettings({ project }: { project: any }) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  
  const initialAuth = project.auth_config || { type: 'none' }
  const [authType, setAuthType] = React.useState(initialAuth.type)
  const [bearerToken, setBearerToken] = React.useState(initialAuth.token || '')
  const [basicUser, setBasicUser] = React.useState(initialAuth.username || '')
  const [basicPass, setBasicPass] = React.useState(initialAuth.password || '')
  const [apiKeyName, setApiKeyName] = React.useState(initialAuth.keyName || 'x-api-key')
  const [apiKeyValue, setApiKeyValue] = React.useState(initialAuth.keyValue || '')

  async function handleSave() {
    setIsSaving(true)
    
    const config: any = { type: authType }
    if (authType === 'bearer') config.token = bearerToken
    if (authType === 'basic') {
      config.username = basicUser
      config.password = basicPass
    }
    if (authType === 'apikey') {
      config.keyName = apiKeyName
      config.keyValue = apiKeyValue
    }

    const result = await updateProjectAuth(project.id, config)
    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Project settings saved successfully')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {authType === 'none' ? <ShieldAlert className="h-5 w-5 text-muted-foreground" /> : <ShieldCheck className="h-5 w-5 text-green-500" />}
            Authentication Settings
          </CardTitle>
          <CardDescription>
            Define the default authentication requirement for all endpoints in this project.
            Endpoints can override this setting individually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Authentication Type</Label>
            <Select value={authType} onValueChange={setAuthType}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Public)</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="apikey">API Key (Custom Header)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authType === 'bearer' && (
            <div className="space-y-2">
              <Label>Required Bearer Token</Label>
              <Input 
                placeholder="e.g. sk_live_12345" 
                value={bearerToken}
                onChange={e => setBearerToken(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Clients must send <code className="bg-muted px-1 rounded">Authorization: Bearer {bearerToken || '...'}</code>
              </p>
            </div>
          )}

          {authType === 'basic' && (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  value={basicUser}
                  onChange={e => setBasicUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={basicPass}
                  onChange={e => setBasicPass(e.target.value)}
                />
              </div>
            </div>
          )}

          {authType === 'apikey' && (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Header Name</Label>
                <Input 
                  value={apiKeyName}
                  onChange={e => setApiKeyName(e.target.value)}
                  placeholder="x-api-key"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Value</Label>
                <Input 
                  value={apiKeyValue}
                  onChange={e => setApiKeyValue(e.target.value)}
                  placeholder="secret-value"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
