// components/ui/EditProductOrderDialog.tsx - Mobile Responsive Update
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { updateProductOrder } from "@/lib/actions";

interface EditProductOrderDialogProps {
  order: ProductOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductOrderDialog({ order, open, onOpenChange }: EditProductOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_mobile: order.customer_mobile || "",
  });

  const formatStudioName = (studioSlug: string) => {
    return studioSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateProductOrder(order.id, formData);
      if (result.error) {
        toast.error("Update Failed", { description: result.error });
      } else {
        toast.success("Order Updated");
        onOpenChange(false);
        router.refresh();
      }
    } catch {
      toast.error("Update Failed", { description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Product Order</DialogTitle>
          <DialogDescription>Update details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          
          {/* Info Header */}
          <div className="space-y-2 bg-muted/30 p-3 rounded-md text-sm">
             <div className="flex justify-between items-center">
                 <span className="text-muted-foreground">Studio:</span>
                 <Badge variant="secondary" className="text-[10px]">{formatStudioName(order.studio_slug)}</Badge>
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-muted-foreground">Order ID:</span>
                 <span className="font-mono text-xs">{order.order_id}</span>
             </div>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
              <div className="space-y-1">
                  <Label htmlFor="customer_name" className="text-xs text-muted-foreground">Customer Name</Label>
                  <Input id="customer_name" name="customer_name" value={formData.customer_name} onChange={handleChange} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                  <Label htmlFor="customer_email" className="text-xs text-muted-foreground">Email</Label>
                  <Input id="customer_email" name="customer_email" type="email" value={formData.customer_email} onChange={handleChange} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                  <Label htmlFor="customer_mobile" className="text-xs text-muted-foreground">Mobile</Label>
                  <Input id="customer_mobile" name="customer_mobile" type="tel" value={formData.customer_mobile} onChange={handleChange} className="h-9 text-sm" />
              </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">{isLoading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}