// components/ui/AddEquipmentDialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addRentalEquipment } from "@/lib/actions";

export function AddEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    daily_rate: "",
    quantity_total: "",
    image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addRentalEquipment({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        daily_rate: parseFloat(formData.daily_rate),
        quantity_total: parseInt(formData.quantity_total),
        image_url: formData.image_url || null,
      });

      if (result.error) {
        toast.error("Failed to add equipment", { description: result.error });
      } else {
        toast.success("Equipment Added Successfully");
        setOpen(false);
        setFormData({
          name: "",
          category: "",
          description: "",
          daily_rate: "",
          quantity_total: "",
          image_url: "",
        });
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add New Rental Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          <div className="space-y-2">
            <Label>Equipment Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sony A7IV Body"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Camera">Camera</SelectItem>
                <SelectItem value="Lens">Lens</SelectItem>
                <SelectItem value="Lighting">Lighting</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Support">Support (Tripods/Gimbals)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Rate (Rs)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Total Quantity</Label>
              <Input
                type="number"
                value={formData.quantity_total}
                onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                placeholder="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key specs or details..."
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add to Fleet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}