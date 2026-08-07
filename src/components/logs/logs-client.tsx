'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { clearFilteredLogs } from '@/features/logs/actions'
import { LogsTable } from './logs-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Trash, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

export function LogsClient({ 
  logs, 
  projects, 
  totalCount, 
  currentPage, 
  pageSize, 
  searchParams: serverParams 
}: { 
  logs: any[];
  projects: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchParams: Record<string, string | undefined>;
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isDeleting, setIsDeleting] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(serverParams.search || '')

  const totalPages = Math.ceil(totalCount / pageSize)

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (serverParams.search || '')) {
        handleFilterChange('search', searchValue || 'all')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  const handleFilterChange = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    
    if (!value || value === 'all') {
      current.delete(key)
    } else {
      current.set(key, value)
    }
    
    // Reset to page 1 when filters change
    if (key !== 'page') {
      current.delete('page')
    }

    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
  }

  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete all logs matching these filters? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const result = await clearFilteredLogs({
      project: serverParams.project,
      method: serverParams.method,
      status: serverParams.status,
      search: serverParams.search,
    })
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Logs cleared successfully')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by URL..."
            className="pl-8"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <Select 
          value={serverParams.project || 'all'} 
          onValueChange={(val) => handleFilterChange('project', (val as string) || '')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={serverParams.method || 'all'} 
          onValueChange={(val) => handleFilterChange('method', (val as string) || '')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={serverParams.status || 'all'} 
          onValueChange={(val) => handleFilterChange('status', (val as string) || '')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="2xx">2xx Success</SelectItem>
            <SelectItem value="3xx">3xx Redirect</SelectItem>
            <SelectItem value="4xx">4xx Client Error</SelectItem>
            <SelectItem value="5xx">5xx Server Error</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="destructive" 
          onClick={handleBulkDelete}
          disabled={isDeleting || logs.length === 0}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash className="mr-2 h-4 w-4" />
          )}
          Clear Current Logs
        </Button>
      </div>

      <LogsTable logs={logs} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handleFilterChange('page', (currentPage - 1).toString())}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handleFilterChange('page', (currentPage + 1).toString())}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
