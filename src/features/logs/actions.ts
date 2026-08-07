'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  const adminSupabase = createAdminClient()

  // Delete all logs for the project
  const { error } = await adminSupabase
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
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: logEntry } = await supabase
    .from('request_logs')
    .select('project_id')
    .eq('id', logId)
    .single()
    
  if (!logEntry) return { error: 'Log not found' }
  
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', logEntry.project_id)
    .eq('user_id', user.id)
    .single()
    
  if (!project) return { error: 'Unauthorized' }

  const { error } = await adminSupabase
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
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: userProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)

  if (!userProjects || userProjects.length === 0) {
    return { success: true }
  }

  const projectIds = userProjects.map(p => p.id)
  let query = adminSupabase.from('request_logs').delete()

  if (filters.project && filters.project !== 'all') {
    if (!projectIds.includes(filters.project)) return { error: 'Unauthorized' }
    query = query.eq('project_id', filters.project)
  } else {
    query = query.in('project_id', projectIds)
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

  const { error } = await query

  if (error) return { error: error.message }
  
  revalidatePath('/logs')
  return { success: true }
}
