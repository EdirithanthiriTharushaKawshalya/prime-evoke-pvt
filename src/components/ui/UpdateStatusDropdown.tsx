"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateBookingStatus } from "@/lib/actions";
import { toast } from "sonner";

const STATUS_OPTIONS = ["New", "Contacted", "Confirmed", "Completed", "Cancelled"];

type UpdateStatusDropdownProps = {
  bookingId: number;
  currentStatus: string | null;
  userRole: string;
  isPast: boolean;
};

const getStatusVariant = (
  status: string | null,
  isPast: boolean
): "default" | "secondary" | "destructive" | "outline" | "success" => {
  if (status?.toLowerCase() === "cancelled") return "destructive";
  if (isPast) return "success";
  switch (status?.toLowerCase()) {
    case "new":
      return "default";
    case "confirmed":
      return "secondary";
    case "completed":
      return "outline";
    case "contacted":
      return "secondary";
    default:
      return "secondary";
  }
};

export function UpdateStatusDropdown({
  bookingId,
  currentStatus,
  userRole,
  isPast,
}: UpdateStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus ?? "New");
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === status) return;

    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, newStatus);
      if (result?.error) {
        toast.error("Failed to update status", { description: result.error });
      } else {
        setStatus(newStatus);
        toast.success("Booking status updated!");
      }
    });
  };

  const variant = getStatusVariant(status, isPast);
  
  // Determine display text
  let displayText = status;
  if (isPast && status?.toLowerCase() !== "cancelled") {
    displayText = "Completed";
  }

  // Staff view: Read-only Badge
  if (userRole !== "management") {
    if (variant === "success") {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
          {displayText}
        </Badge>
      );
    }
    return <Badge variant={variant}>{displayText}</Badge>;
  }

  // Management view: Interactive dropdown
  return (
    <Select 
      value={isPast && status?.toLowerCase() !== "cancelled" ? "Completed" : status} 
      onValueChange={handleStatusChange} 
      disabled={isPending || isPast}
    >
      <SelectTrigger
        className={`w-[130px] h-8 text-xs font-medium border-none ring-offset-0 focus:ring-0 focus:ring-offset-0 ${
          variant === "success"
            ? "bg-green-600 text-white hover:bg-green-600/90"
            : variant === "destructive"
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : variant === "default"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : variant === "outline"
            ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        } ${isPast ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <SelectValue placeholder="Set status">
          {displayText}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="bg-gray-900 border-white/20 text-white">
        {STATUS_OPTIONS.map((option) => (
          <SelectItem 
            key={option} 
            value={option}
            className="hover:bg-gray-800 focus:bg-gray-800"
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}