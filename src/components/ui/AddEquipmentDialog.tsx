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
import { Plus, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { addRentalEquipment } from "@/lib/actions";
import { supabase } from "@/lib/supabaseClient";

export function AddEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    daily_rate: "",
    quantity_total: "",
    store_location: "colombo", // Default
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let publicUrl = null;

      // 1. Upload Image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('equipment-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error("Image upload failed: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(filePath);

        publicUrl = urlData.publicUrl;
      }

      // 2. Save Record
      const result = await addRentalEquipment({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        daily_rate: parseFloat(formData.daily_rate),
        quantity_total: parseInt(formData.quantity_total),
        image_url: publicUrl,
        store_location: formData.store_location, // Ensure this exists in your DB schema or add to types
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
          store_location: "colombo",
        });
        setImageFile(null);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camera">Camera</SelectItem>
                  <SelectItem value="Lens">Lens</SelectItem>
                  <SelectItem value="Lighting">Lighting</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Store Location</Label>
              <Select
                value={formData.store_location}
                onValueChange={(val) => setFormData({ ...formData, store_location: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colombo">Colombo</SelectItem>
                  <SelectItem value="ambalangoda">Ambalangoda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Rate (Rs)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Total Quantity</Label>
              <Input
                type="number"
                value={formData.quantity_total}
                onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipment Image</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imageFile ? <div className="text-green-500"><Upload className="h-4 w-4"/></div> : <ImageIcon className="h-4 w-4 text-muted-foreground"/>}
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
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Add to Fleet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}