// components/ui/UpdateBookingStatus.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { updateBookingStatus } from "@/lib/actions";

interface UpdateBookingStatusProps {
  bookingId: number;
  currentStatus: string;
  userRole: string;
}

const statusOptions = [
  { value: "New", label: "New", color: "bg-blue-500" },
  { value: "Contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "Confirmed", label: "Confirmed", color: "bg-green-500" },
  { value: "Completed", label: "Completed", color: "bg-purple-500" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-500" },
];

export function UpdateBookingStatus({ 
  bookingId, 
  currentStatus, 
  userRole 
}: UpdateBookingStatusProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Only management can update status
  if (userRole !== "management") {
    const currentStatusOption = statusOptions.find(opt => opt.value === currentStatus);
    return (
      <Badge 
        className={`${currentStatusOption?.color || "bg-gray-500"} text-white`}
      >
        {currentStatus}
      </Badge>
    );
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    
    try {
      const result = await updateBookingStatus(bookingId, newStatus);
      
      if (result.error) {
        toast.error("Status Update Failed", {
          description: result.error,
        });
      } else {
        toast.success("Status Updated", {
          description: `Booking status changed to ${newStatus}`,
        });
      }
    } catch {
      toast.error("Status Update Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusOption = statusOptions.find(opt => opt.value === currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isUpdating}
          className="flex items-center gap-1"
        >
          <Badge className={`${currentStatusOption?.color || "bg-gray-500"} text-white mr-1`}>
            {currentStatus}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusUpdate(status.value)}
            disabled={status.value === currentStatus || isUpdating}
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${status.color}`} />
            {status.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}