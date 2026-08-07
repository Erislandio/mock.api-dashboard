"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Settings2, Trash } from "lucide-react";
import * as React from "react";

export type FieldDef = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  children?: FieldDef[];
};

function parseSchemaToFields(schema: any): FieldDef[] {
  if (schema.type !== "object" || !schema.properties) return [];

  const fields: FieldDef[] = [];
  for (const [k, v] of Object.entries<any>(schema.properties)) {
    const field: FieldDef = {
      id: Math.random().toString(),
      name: k,
      type: "string", // default
      required: schema.required?.includes(k) || false
    };

    if (v.type === "object") {
      field.type = "object";
      field.children = parseSchemaToFields(v);
    } else if (v.type === "array") {
      field.type = "array";
      if (v.items && v.items.type === "object") {
        field.children = parseSchemaToFields(v.items);
      } else {
        field.children = [];
      }
    } else if (v.type === "string") {
      if (v.format === "email") field.type = "email";
      else if (v.format === "uuid") field.type = "uuid";
      else if (v.format === "date-time") field.type = "date";
      else field.type = "string";
    } else if (v.type) {
      field.type = v.type;
    }

    fields.push(field);
  }
  return fields;
}

function generateSchemaFromFields(fields: FieldDef[]): any {
  const schema: any = {
    type: "object",
    properties: {},
    required: []
  };

  fields.forEach((f) => {
    if (!f.name) return;

    let typeDef: any = {};
    if (f.type === "object") {
      typeDef = generateSchemaFromFields(f.children || []);
    } else if (f.type === "array") {
      typeDef = {
        type: "array",
        items: generateSchemaFromFields(f.children || [])
      };
    } else if (f.type === "uuid") {
      typeDef = { type: "string", format: "uuid" };
    } else if (f.type === "email") {
      typeDef = { type: "string", format: "email" };
    } else if (f.type === "date") {
      typeDef = { type: "string", format: "date-time" };
    } else {
      typeDef = { type: f.type };
    }

    schema.properties[f.name] = typeDef;
    if (f.required) schema.required.push(f.name);
  });

  if (schema.required.length === 0) delete schema.required;
  return schema;
}

export function VisualSchemaBuilder({
  value,
  onChange
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [fields, setFields] = React.useState<FieldDef[]>([]);

  // Parse initial schema
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      setFields(parseSchemaToFields(parsed));
    } catch (e) {
      // ignore
    }
  }, []); // run once on mount

  // Update JSON schema when fields change
  React.useEffect(() => {
    const newSchema = generateSchemaFromFields(fields);
    onChange(JSON.stringify(newSchema, null, 2));
  }, [fields, onChange]);

  function updateNode(
    nodes: FieldDef[],
    id: string,
    updater: (f: FieldDef) => FieldDef
  ): FieldDef[] {
    return nodes.map((n) => {
      if (n.id === id) return updater(n);
      if (n.children) {
        return { ...n, children: updateNode(n.children, id, updater) };
      }
      return n;
    });
  }

  function removeNode(nodes: FieldDef[], id: string): FieldDef[] {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => {
        if (n.children) return { ...n, children: removeNode(n.children, id) };
        return n;
      });
  }

  function addNodeTo(
    nodes: FieldDef[],
    parentId: string,
    newNode: FieldDef
  ): FieldDef[] {
    if (parentId === "root") return [...nodes, newNode];
    return nodes.map((n) => {
      if (n.id === parentId)
        return { ...n, children: [...(n.children || []), newNode] };
      if (n.children)
        return { ...n, children: addNodeTo(n.children, parentId, newNode) };
      return n;
    });
  }

  const handleUpdate = (id: string, updates: Partial<FieldDef>) => {
    setFields((prev) =>
      updateNode(prev, id, (f) => {
        const updated = { ...f, ...updates };
        // Initialize children array if changing to object/array
        if (
          (updated.type === "object" || updated.type === "array") &&
          !updated.children
        ) {
          updated.children = [];
        }
        return updated;
      })
    );
  };

  const handleRemove = (id: string) => {
    setFields((prev) => removeNode(prev, id));
  };

  const handleAdd = (parentId: string) => {
    setFields((prev) =>
      addNodeTo(prev, parentId, {
        id: Math.random().toString(),
        name: "",
        type: "string",
        required: false,
        children: []
      })
    );
  };

  const renderNodes = (nodes: FieldDef[]) => {
    return (
      <div className="space-y-3">
        {nodes.map((field) => (
          <div key={field.id} className="space-y-3">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 border rounded bg-muted/20">
              <div className="flex-1 min-w-[150px]">
                <Label className="sr-only">Field Name</Label>
                <Input
                  placeholder="Field name (e.g. email)"
                  value={field.name}
                  onChange={(e) =>
                    handleUpdate(field.id, { name: e.target.value })
                  }
                />
              </div>
              <div className="w-[140px] flex-shrink-0">
                <Select
                  value={field.type}
                  onValueChange={(val) =>
                    handleUpdate(field.id, {
                      type: (val as string) || "string"
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="uuid">UUID</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={field.required}
                  onCheckedChange={(val) =>
                    handleUpdate(field.id, { required: val })
                  }
                  id={`req-${field.id}`}
                />
                <Label htmlFor={`req-${field.id}`} className="text-sm">
                  Required
                </Label>
              </div>

              {(field.type === "object" || field.type === "array") && (
                <Dialog modal>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        title={`Configure ${field.type}`}
                      />
                    }
                  >
                    <Settings2 className="h-4 w-4" />
                  </DialogTrigger>
                  <DialogContent className="min-w-3xl max-w-3xl max-h-[85vh] overflow-y-auto w-full">
                    <DialogHeader>
                      <DialogTitle>
                        Configure {field.name || "Field"} ({field.type})
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {field.type === "array"
                            ? "Define the properties for items in this array."
                            : "Define properties for this object."}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdd(field.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add{" "}
                          {field.type === "array" ? "item property" : "field"}
                        </Button>
                      </div>

                      {!field.children || field.children.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded">
                          No properties defined.
                        </div>
                      ) : (
                        <div className="mt-4">
                          {renderNodes(field.children)}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive flex-shrink-0"
                onClick={() => handleRemove(field.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Visual Schema Builder</h4>
        <Button size="sm" variant="outline" onClick={() => handleAdd("root")}>
          <Plus className="h-4 w-4 mr-2" /> Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded">
          No fields defined. Add a field to generate your schema.
        </div>
      ) : (
        renderNodes(fields)
      )}
    </div>
  );
}
