"use client";

import { Button } from "@/components/ui/button";
import { deleteEndpoint } from "@/features/endpoints/actions";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteEndpointButton({ endpointId, projectId }: { endpointId: string, projectId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this endpoint? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteEndpoint(endpointId, projectId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Endpoint deleted successfully");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete endpoint");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Delete</span>
    </Button>
  );
}
