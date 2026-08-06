'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
})

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  const data = Object.fromEntries(formData)
  const result = projectSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error: insertError } = await supabase.from('projects').insert({
    user_id: user.id,
    name: result.data.name,
    description: result.data.description,
    slug: result.data.slug,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'A project with this slug already exists' }
    }
    return { error: insertError.message }
  }

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('projects').delete().eq('id', projectId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  revalidatePath('/projects')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProjectAuth(projectId: string, authConfig: any) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('projects')
    .update({ auth_config: authConfig })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
