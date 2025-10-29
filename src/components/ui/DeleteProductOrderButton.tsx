// components/ui/DeleteProductOrderButton.tsx
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
import { deleteProductOrder } from "@/lib/actions"; // We will create this action

interface DeleteProductOrderButtonProps {
  orderId: number; // Changed from bookingId
  userRole: string;
}

export function DeleteProductOrderButton({
  orderId,
  userRole,
}: DeleteProductOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only management can delete
  if (userRole !== "management") {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteProductOrder(orderId); // Call new action
      
      if (result.error) {
        toast.error("Delete Failed", {
          description: result.error,
        });
      } else {
        toast.success("Order Deleted", {
          description: "The product order has been successfully deleted.",
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
          <DialogTitle>Delete Product Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this product order? This action cannot be
            undone and all order data will be permanently removed.
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
            {isDeleting ? "Deleting..." : "Delete Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}