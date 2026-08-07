'use client'

import * as React from 'react'
import { Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type FieldDef = {
  id: string
  name: string
  type: string
  required: boolean
}

export function VisualSchemaBuilder({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [fields, setFields] = React.useState<FieldDef[]>([])

  // Parse initial schema
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(value)
      if (parsed.type === 'object' && parsed.properties) {
        const loadedFields = Object.entries(parsed.properties).map(([k, v]: [string, any]) => ({
          id: Math.random().toString(),
          name: k,
          type: v.type || 'string',
          required: parsed.required?.includes(k) || false,
        }))
        setFields(loadedFields)
      }
    } catch (e) {
      // ignore
    }
  }, []) // run once on mount

  // Update JSON schema when fields change
  React.useEffect(() => {
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    }
    
    fields.forEach((f) => {
      if (!f.name) return
      
      let typeDef: any = { type: f.type }
      
      if (f.type === 'uuid') {
        typeDef = { type: 'string', format: 'uuid' }
      } else if (f.type === 'email') {
        typeDef = { type: 'string', format: 'email' }
      } else if (f.type === 'date') {
        typeDef = { type: 'string', format: 'date-time' }
      }

      schema.properties[f.name] = typeDef
      
      if (f.required) {
        schema.required.push(f.name)
      }
    })

    if (schema.required.length === 0) delete schema.required

    onChange(JSON.stringify(schema, null, 2))
  }, [fields, onChange])

  function addField() {
    setFields([...fields, { id: Math.random().toString(), name: '', type: 'string', required: false }])
  }

  function updateField(id: string, updates: Partial<FieldDef>) {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  function removeField(id: string) {
    setFields(fields.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Visual Schema Builder</h4>
        <Button size="sm" variant="outline" onClick={addField}>
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded">
          No fields defined. Add a field to generate your schema.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 border rounded bg-muted/20">
              <div className="flex-1 min-w-[150px]">
                <Label className="sr-only">Field Name</Label>
                <Input
                  placeholder="Field name (e.g. email)"
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                />
              </div>
              <div className="w-[140px] flex-shrink-0">
                <Select value={field.type} onValueChange={(val) => updateField(field.id, { type: (val as string) || 'string' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="uuid">UUID</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={field.required}
                  onCheckedChange={(val) => updateField(field.id, { required: val })}
                  id={`req-${field.id}`}
                />
                <Label htmlFor={`req-${field.id}`} className="text-sm">Required</Label>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive flex-shrink-0" onClick={() => removeField(field.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
