// components/ui/DeleteBookingButton.tsx
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBooking } from "@/lib/actions";

interface DeleteBookingButtonProps {
  bookingId: number;
  userRole: string;
}

export function DeleteBookingButton({
  bookingId,
  userRole,
}: DeleteBookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only management can delete bookings
  if (userRole !== "management") {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteBooking(bookingId);
      
      if (result.error) {
        toast.error("Delete Failed", {
          description: result.error,
        });
      } else {
        toast.success("Booking Deleted", {
          description: "The booking has been successfully deleted.",
        });
        setIsOpen(false);
      }
    } catch {
      toast.error("Delete Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Booking</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this booking? This action cannot be
            undone and all booking data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}