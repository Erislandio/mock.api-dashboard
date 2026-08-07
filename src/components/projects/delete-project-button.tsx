"use client";

import { Button } from "@/components/ui/button";
import { deleteProject } from "@/features/projects/actions";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteProject(projectId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Project deleted successfully");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Delete Project</span>
    </Button>
  );
}
