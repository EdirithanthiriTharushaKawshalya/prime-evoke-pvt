// components/ui/EditProductOrderDialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- For speed fix
import { ProductOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { updateProductOrder } from "@/lib/actions"; // <-- New action

interface EditProductOrderDialogProps {
  order: ProductOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductOrderDialog({ order, open, onOpenChange }: EditProductOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // <-- For speed fix
  const [formData, setFormData] = useState({
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_mobile: order.customer_mobile || "",
  });

  // Format studio slug to readable name
  const formatStudioName = (studioSlug: string) => {
    return studioSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateProductOrder(order.id, formData); // <-- Use new action
      
      if (result.error) {
        toast.error("Update Failed", {
          description: result.error,
        });
      } else {
        toast.success("Order Updated", {
          description: "The order details have been successfully updated.",
        });
        onOpenChange(false);
        router.refresh(); // <-- Speed fix: soft refresh
      }
    } catch {
      toast.error("Update Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product Order</DialogTitle>
          <DialogDescription>
            Update the customer details for this order. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Studio Display (Read-only) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studio" className="text-right">
                Studio
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">
                  {formatStudioName(order.studio_slug)}
                </Badge>
              </div>
            </div>

            {/* Order ID Display (Read-only) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_id" className="text-right">
                Order ID
              </Label>
              <Input
                id="order_id"
                name="order_id"
                value={order.order_id}
                readOnly
                className="col-span-3 border-dashed"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_name" className="text-right">
                Customer Name
              </Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_email" className="text-right">
                Email
              </Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer_mobile" className="text-right">
                Mobile
              </Label>
              <Input
                id="customer_mobile"
                name="customer_mobile"
                type="tel"
                value={formData.customer_mobile}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}