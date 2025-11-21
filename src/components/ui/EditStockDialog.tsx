// components/ui/EditStockDialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateStockItem, deleteStockItem } from "@/lib/actions";

interface EditStockDialogProps {
  item: StockItem;
}

export function EditStockDialog({ item }: EditStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    item_name: item.item_name,
    category: item.category,
    unit_price: item.unit_price,
    reorder_level: item.reorder_level,
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateStockItem(item.id, formData);
      if (result.error) {
        toast.error("Update Failed", { description: result.error });
      } else {
        toast.success("Item Updated");
        setOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setLoading(true);
    try {
      const result = await deleteStockItem(item.id);
      if (result.error) {
        toast.error("Delete Failed", { description: result.error });
      } else {
        toast.success("Item Deleted");
        setOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Item Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="item_name">Item Name</Label>
            <Input id="item_name" value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit_price">Unit Price (Rs.)</Label>
            <Input id="unit_price" type="number" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reorder_level">Low Stock Alert Level</Label>
            <Input id="reorder_level" type="number" value={formData.reorder_level} onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})} />
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between mt-4">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}