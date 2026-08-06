import { createClient } from '@/lib/supabase/server'
import { PlaygroundClient } from '@/components/playground/playground-client'
import { Play } from 'lucide-react'

export default async function PlaygroundPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, public_token')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-2">
        <Play className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Playground</h1>
      </div>
      <p className="text-muted-foreground -mt-4">
        Test your mock API endpoints interactively.
      </p>

      {projects && projects.length > 0 ? (
        <PlaygroundClient projects={projects} />
      ) : (
        <div className="flex flex-1 items-center justify-center border rounded-md border-dashed">
          <p className="text-muted-foreground">You need to create a project first.</p>
        </div>
      )}
    </div>
  )
}
