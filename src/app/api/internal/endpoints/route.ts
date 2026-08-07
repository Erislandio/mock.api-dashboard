import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data: endpoints } = await supabase.from('endpoints').select('id, name, method, path, example_request, schema').eq('project_id', project.id).order('created_at', { ascending: true })

  return NextResponse.json(endpoints || [])
}
