// components/ui/AssignProductOrderPhotographers.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { updateProductOrderAssignments } from "@/lib/actions"; // Use new action

interface AssignProductOrderPhotographersProps {
  orderId: number; // Use orderId
  currentAssignments: string[];
  availableStaff: { id: string; full_name: string }[];
  userRole: string;
}

export function AssignProductOrderPhotographers({
  orderId,
  currentAssignments,
  availableStaff,
  userRole,
}: AssignProductOrderPhotographersProps) {
  const [selectedStaff, setSelectedStaff] = useState(new Set(currentAssignments));
  const [isPending, startTransition] = useTransition();

  if (userRole !== "management") {
    return null;
  }

  const handleSelection = (staffName: string) => {
    const newSet = new Set(selectedStaff);
    if (newSet.has(staffName)) {
      newSet.delete(staffName);
    } else {
      newSet.add(staffName);
    }
    setSelectedStaff(newSet);

    // Optimistic update (optional, good for UX)
    // Or just update on save
  };

  const handleSaveAssignments = () => {
    startTransition(async () => {
      const newAssignments = Array.from(selectedStaff);
      const result = await updateProductOrderAssignments(orderId, newAssignments); // Use new action

      if (result.error) {
        toast.error("Failed to update assignments", {
          description: result.error,
        });
        // Revert optimistic update if you did one
        setSelectedStaff(new Set(currentAssignments));
      } else {
        toast.success("Assignments updated successfully");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3 w-3 mr-1" />
          Assign
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Assign Photographers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStaff.length > 0 ? (
          availableStaff.map((staff) => (
            <DropdownMenuCheckboxItem
              key={staff.id}
              checked={selectedStaff.has(staff.full_name)}
              onCheckedChange={() => handleSelection(staff.full_name)}
              onSelect={(e) => e.preventDefault()} // Prevent menu from closing on click
            >
              {staff.full_name}
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No staff available</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSaveAssignments}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90"
        >
          {isPending ? "Saving..." : "Save Assignments"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}