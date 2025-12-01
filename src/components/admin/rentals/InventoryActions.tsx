"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRentalEquipment, updateRentalEquipment } from "@/lib/actions";
import { RentalEquipment } from "@/lib/types";

export function InventoryActions({ item }: { item: RentalEquipment }) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name,
    quantity_total: item.quantity_total,
    daily_rate: item.daily_rate
  });

  const handleDelete = async () => {
    if (!confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    const res = await deleteRentalEquipment(item.id);
    if (res.error) toast.error(res.error);
    else {
        toast.success("Equipment deleted");
        router.refresh();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateRentalEquipment(item.id, {
        name: formData.name,
        quantity_total: Number(formData.quantity_total),
        daily_rate: Number(formData.daily_rate)
    });
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
        toast.success("Equipment updated");
        setOpenEdit(false);
        router.refresh();
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setOpenEdit(true)}>
        <Edit className="h-3 w-3" />
      </Button>
      
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Total Quantity</Label><Input type="number" value={formData.quantity_total} onChange={e => setFormData({...formData, quantity_total: Number(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Daily Rate (Rs)</Label><Input type="number" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: Number(e.target.value)})} /></div>
            <DialogFooter>
                <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4"/> : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}