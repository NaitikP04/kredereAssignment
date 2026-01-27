"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriorityUpdaterProps {
  jobId: string;
  currentPriority: number;
  status: string; // We need status to disable the input if not pending!
}

export function PriorityUpdater({ jobId, currentPriority, status }: PriorityUpdaterProps) {
  // We initialize local state with the prop from the server
  const [priority, setPriority] = useState(currentPriority.toString());
  const queryClient = useQueryClient();

  // Logic Rule: You can only edit Pending jobs
  const isEditable = status === "pending";

  const { mutate, isPending } = useMutation({
    mutationFn: async (newPriority: string) => {
      // 1. The actual network request
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: parseInt(newPriority) }),
      });

      // 2. handling non-200 responses manually
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // 3. Success Feedback
      toast.success(`Priority updated to ${data.priority}`);
      
      // 4. Force the Job Details page to refresh its data
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["recent-jobs"] });

    },
    onError: (error) => {
      // 5. Error Feedback (Revert the UI)
      toast.error(error.message);
      setPriority(currentPriority.toString()); // Reset dropdown to original value
    },
  });

  const handleValueChange = (value: string) => {
    setPriority(value); // Optimistic UI update (feels fast)
    mutate(value);      // Trigger API
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Priority:</span>
      <Select 
        value={priority} 
        onValueChange={handleValueChange} 
        disabled={isPending || !isEditable} // Disable if saving OR if status != pending
      >
        <SelectTrigger className="w-[80px] h-8">
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((p) => (
            <SelectItem key={p} value={p.toString()}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}