'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const endpointSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, 'Endpoint name is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with /'),
})

export async function createEndpoint(formData: FormData) {
  const supabase = await createClient()

  const data = {
    projectId: formData.get('projectId') as string,
    name: formData.get('name') as string,
    method: formData.get('method') as any,
    path: formData.get('path') as string,
  }

  const result = endpointSchema.safeParse(data)

  if (!result.success) {
    return { error: result.error.errors[0].message }
  }

  // Ensure project belongs to user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if endpoint with same method and path exists for project
  const { data: existing } = await supabase
    .from('endpoints')
    .select('id')
    .eq('project_id', result.data.projectId)
    .eq('method', result.data.method)
    .eq('path', result.data.path)
    .single()

  if (existing) {
    return { error: 'An endpoint with this method and path already exists in this project' }
  }

  const { data: newEndpoint, error: insertError } = await supabase.from('endpoints').insert({
    project_id: result.data.projectId,
    name: result.data.name,
    method: result.data.method,
    path: result.data.path,
    status_code: 200,
    delay_ms: 0,
    headers: {},
    response: { message: "Success" },
    crud_enabled: false,
    is_active: true,
  }).select('id').single()

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath(`/projects/${result.data.projectId}`)
  return { success: true, endpointId: newEndpoint.id }
}

const updateEndpointSchema = z.object({
  endpointId: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  path: z.string().min(1).startsWith('/'),
  status_code: z.number().int().min(100).max(599),
  delay_ms: z.number().int().min(0).max(30000),
  response: z.string().optional(),
  schema: z.string().optional(),
  example_request: z.string().optional(),
  crud_enabled: z.boolean(),
  is_active: z.boolean(),
  enable_logs: z.boolean(),
})

export async function updateEndpoint(formData: FormData) {
  const supabase = await createClient()

  let responseObj = null
  let schemaObj = null
  let exampleRequestObj = null
  let authConfigObj = { type: 'inherit' }
  
  try {
    const rawResponse = formData.get('response') as string
    if (rawResponse) responseObj = JSON.parse(rawResponse)
    
    const rawSchema = formData.get('schema') as string
    if (rawSchema) schemaObj = JSON.parse(rawSchema)
      
    const rawExampleRequest = formData.get('example_request') as string
    if (rawExampleRequest) exampleRequestObj = JSON.parse(rawExampleRequest)

    const rawAuthConfig = formData.get('auth_config') as string
    if (rawAuthConfig) authConfigObj = JSON.parse(rawAuthConfig)
  } catch (e) {
    return { error: 'Invalid JSON format in response, schema, auth config or example payload' }
  }

  const data = {
    endpointId: formData.get('endpointId') as string,
    projectId: formData.get('projectId') as string,
    name: formData.get('name') as string,
    method: formData.get('method') as any,
    path: formData.get('path') as string,
    status_code: parseInt(formData.get('status_code') as string || '200'),
    delay_ms: parseInt(formData.get('delay_ms') as string || '0'),
    crud_enabled: formData.get('crud_enabled') === 'true',
    is_active: formData.get('is_active') === 'true',
    enable_logs: formData.get('enable_logs') !== 'false', // default true
  }

  const result = updateEndpointSchema.safeParse(data)
  if (!result.success) return { error: result.error.errors[0].message }

  const { error } = await supabase.from('endpoints').update({
    name: result.data.name,
    method: result.data.method,
    path: result.data.path,
    status_code: result.data.status_code,
    delay_ms: result.data.delay_ms,
    crud_enabled: result.data.crud_enabled,
    is_active: result.data.is_active,
    enable_logs: result.data.enable_logs,
    response: responseObj,
    schema: schemaObj,
    example_request: exampleRequestObj,
    auth_config: authConfigObj
  }).eq('id', result.data.endpointId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${result.data.projectId}`)
  revalidatePath(`/projects/${result.data.projectId}/endpoints/${result.data.endpointId}`)
  return { success: true }
}

export async function deleteEndpoint(endpointId: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('endpoints').delete().eq('id', endpointId)
  
  if (error) return { error: error.message }
  
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
