'use client'

import * as React from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createApiKey } from '@/features/keys/actions'

export function CreateKeyDialog({ projects }: { projects: any[] }) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [projectId, setProjectId] = React.useState(projects[0]?.id || '')
  const [name, setName] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId || !name) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('projectId', projectId)
    formData.append('name', name)

    const result = await createApiKey(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('API Key created successfully')
      setOpen(false)
      setName('')
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={projects.length === 0} />}>
        <Plus className="mr-2 h-4 w-4" />
        New API Key
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Generate a new API key to authenticate requests to your Mock API endpoints.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Key Name</Label>
            <Input id="name" placeholder="e.g. Production Key" value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
