import { createClient } from '@/lib/supabase/server'
import { KeyRound } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CreateKeyDialog } from '@/components/keys/create-key-dialog'
import { KeyItem } from '@/components/keys/key-item'

export default async function KeysPage() {
  const supabase = await createClient()

  // Get Projects for the dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: false })

  // Get API Keys
  const { data: keys } = await supabase
    .from('api_keys')
    .select(`
      *,
      projects ( name )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for authenticating mock requests.
          </p>
        </div>
        <CreateKeyDialog projects={projects || []} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {keys && keys.length > 0 ? (
            <div className="space-y-4">
              {keys.map((apiKey) => (
                <KeyItem key={apiKey.id} apiKey={apiKey} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No API Keys</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
                You haven't generated any API keys yet. Create one to authenticate requests to your endpoints.
              </p>
              <CreateKeyDialog projects={projects || []} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
