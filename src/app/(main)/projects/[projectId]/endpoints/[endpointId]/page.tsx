import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { EditEndpointForm } from '@/components/endpoints/edit-endpoint-form'

export default async function EndpointPage(props: { params: Promise<{ projectId: string, endpointId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', params.projectId)
    .single()

  if (!project) notFound()

  const { data: endpoint } = await supabase
    .from('endpoints')
    .select('*')
    .eq('id', params.endpointId)
    .single()

  if (!endpoint) notFound()

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors">
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{endpoint.name}</span>
      </div>

      <EditEndpointForm endpoint={endpoint} projectId={project.id} />
    </div>
  )
}
