'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function LogsTable({ logs }: { logs: any[] }) {
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null)

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{log.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-sm">
                    {log.url}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status >= 400 ? 'destructive' : 'default'} className={log.status < 400 && log.status >= 200 ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {log.duration_ms}ms
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.ip_address}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No request logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">{selectedLog?.method}</Badge>
              <span className="font-mono text-sm break-all">{selectedLog?.url}</span>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-sm border-b pb-4">
                <div>
                  <div className="text-muted-foreground mb-1">Status</div>
                  <Badge variant={selectedLog?.status >= 400 ? 'destructive' : 'default'} className={selectedLog?.status < 400 && selectedLog?.status >= 200 ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
                    {selectedLog?.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Duration</div>
                  <div className="font-mono">{selectedLog?.duration_ms}ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Time</div>
                  <div>{selectedLog?.created_at && new Date(selectedLog.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Headers</h4>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(selectedLog?.headers, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedLog?.body && (
                <div>
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {selectedLog?.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
