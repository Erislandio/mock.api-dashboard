'use client'

import * as React from 'react'
import { Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { revokeApiKey } from '@/features/keys/actions'
import { Button } from '@/components/ui/button'

export function KeyItem({ apiKey }: { apiKey: any }) {
  const [copied, setCopied] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.token)
    setCopied(true)
    toast.success('Token copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to revoke this API key? Any applications using it will be denied access.')) return
    setIsDeleting(true)
    const result = await revokeApiKey(apiKey.id)
    if (result?.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success('API Key revoked')
    }
  }

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="space-y-1">
        <p className="font-medium leading-none">{apiKey.name}</p>
        <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md w-fit mt-1 select-all">
          {apiKey.token}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span>Project: {apiKey.projects?.name}</span>
          <span>•</span>
          <span>Last used: {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
