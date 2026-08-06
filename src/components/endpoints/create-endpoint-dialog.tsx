"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import { createEndpoint } from "@/features/endpoints/actions";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]),
  path: z
    .string()
    .min(1, "Path is required")
    .startsWith("/", "Path must start with /")
});

type FormValues = z.infer<typeof formSchema>;

export function CreateEndpointDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      method: "GET",
      path: "/"
    }
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("name", data.name);
    formData.append("method", data.method);
    formData.append("path", data.path);

    const result = await createEndpoint(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("Endpoint created successfully");
      setOpen(false);
      form.reset();
      setIsLoading(false);
      if (result?.endpointId) {
        router.push(`/projects/${projectId}/endpoints/${result.endpointId}`);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        New Endpoint
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Endpoint</DialogTitle>
          <DialogDescription>
            Add a new endpoint to your Mock API project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Endpoint Name</Label>
            <Input
              id="name"
              placeholder="e.g. Get all users"
              disabled={isLoading}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                disabled={isLoading}
                onValueChange={(val) => form.setValue("method", val as any)}
                defaultValue={form.getValues("method")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS",
                    "HEAD"
                  ].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.method && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.method.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                placeholder="/api/users"
                disabled={isLoading}
                {...form.register("path")}
              />
              {form.formState.errors.path && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.path.message}
                </p>
              )}
            </div>
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
  );
}
