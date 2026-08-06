'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearProjectLogs(projectId: string) {
  const supabase = await createClient()

  // Ensure project belongs to user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return { error: 'Project not found or unauthorized' }
  }

  // Delete all logs for the project
  const { error } = await supabase
    .from('request_logs')
    .delete()
    .eq('project_id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteLog(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('request_logs')
    .delete()
    .eq('id', logId)

  if (error) return { error: error.message }
  
  revalidatePath('/logs')
  return { success: true }
}

export async function clearFilteredLogs(filters: {
  project?: string;
  method?: string;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let query = supabase.from('request_logs').delete()

  if (filters.project && filters.project !== 'all') {
    query = query.eq('project_id', filters.project)
  }
  if (filters.method && filters.method !== 'all') {
    query = query.eq('method', filters.method)
  }
  if (filters.status && filters.status !== 'all') {
    if (filters.status === '2xx') {
      query = query.gte('status', 200).lt('status', 300)
    } else if (filters.status === '3xx') {
      query = query.gte('status', 300).lt('status', 400)
    } else if (filters.status === '4xx') {
      query = query.gte('status', 400).lt('status', 500)
    } else if (filters.status === '5xx') {
      query = query.gte('status', 500)
    } else {
      query = query.eq('status', parseInt(filters.status))
    }
  }
  if (filters.search) {
    query = query.ilike('url', `%${filters.search}%`)
  }

  // Without this, the query would delete everything.
  // Wait, if no filters, it deletes all logs for the user.
  // We can't rely on RLS alone if we don't have the user_id on request_logs directly.
  // Wait! RLS for DELETE on request_logs:
  // CREATE POLICY "Users can delete own logs" ON public.request_logs FOR DELETE USING (
  //   EXISTS (SELECT 1 FROM public.projects WHERE id = public.request_logs.project_id AND user_id = auth.uid())
  // );
  // Yes! The RLS policy natively restricts deletes to ONLY the user's logs.

  const { error } = await query

  if (error) return { error: error.message }
  
  revalidatePath('/logs')
  return { success: true }
}
