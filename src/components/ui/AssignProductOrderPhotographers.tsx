// components/ui/AssignProductOrderPhotographers.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { updateProductOrderAssignments } from "@/lib/actions";

interface AssignProductOrderPhotographersProps {
  orderId: number;
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
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStaff, setSelectedStaff] =
    useState<string[]>(currentAssignments);

  // Only management can assign photographers
  if (userRole !== "management") {
    return null;
  }

  const handleStaffToggle = (staffName: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffName)
        ? prev.filter((name) => name !== staffName)
        : [...prev, staffName]
    );
  };

  const handleAssign = async () => {
    setIsAssigning(true);

    try {
      const result = await updateProductOrderAssignments(
        orderId,
        selectedStaff
      );

      if (result.error) {
        toast.error("Assignment Failed", {
          description: result.error,
        });
      } else {
        toast.success("Staff Assigned", {
          description: `Updated assignments for this product order.`,
        });
        setIsOpen(false);
      }
    } catch {
      toast.error("Assignment Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3 w-3 mr-1" />
          Assign Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Assign Staff to Product Order</DialogTitle>
          <DialogDescription>
            Select team members to assign to this product order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {availableStaff.map((staff) => (
              <div key={staff.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`staff-${staff.id}`}
                  checked={selectedStaff.includes(staff.full_name)}
                  onCheckedChange={() => handleStaffToggle(staff.full_name)}
                />
                <Label
                  htmlFor={`staff-${staff.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {staff.full_name}
                </Label>
              </div>
            ))}

            {availableStaff.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No staff members available for assignment.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isAssigning}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || availableStaff.length === 0}
            className="w-full sm:w-auto"
          >
            {isAssigning ? "Assigning..." : "Assign Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
