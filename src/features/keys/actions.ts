'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createApiKey(formData: FormData) {
  const supabase = await createClient()

  const projectId = formData.get('projectId') as string
  const name = formData.get('name') as string

  if (!projectId || !name) {
    return { error: 'Project and name are required' }
  }

  // Ensure user owns project
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Generate a random token
  const token = 'sk_mockapi_' + Buffer.from(crypto.randomUUID()).toString('base64').replace(/=/g, '').toLowerCase()

  const { error: insertError } = await supabase.from('api_keys').insert({
    project_id: projectId,
    name,
    token,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/keys')
  return { success: true }
}

export async function revokeApiKey(keyId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('api_keys').delete().eq('id', keyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/keys')
  return { success: true }
}
