// components/ui/AddEquipmentDialog.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { 
  Plus, Loader2, Image as ImageIcon, X, 
  Camera, MapPin, DollarSign, Package, FileText 
} from "lucide-react";
import { toast } from "sonner";
import { addRentalEquipment } from "@/lib/actions";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function AddEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    daily_rate: "",
    quantity_total: "",
    store_location: "colombo",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

        if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

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
        store_location: formData.store_location,
      });

      if (result.error) {
        toast.error("Failed to add equipment", { description: result.error });
      } else {
        toast.success("Equipment Added Successfully");
        setOpen(false);
        // Reset Form
        setFormData({
          name: "",
          category: "",
          description: "",
          daily_rate: "",
          quantity_total: "",
          store_location: "colombo",
        });
        removeImage();
        router.refresh();
      }
    } catch (error) {
      // Fixed: Properly check error type instead of using 'any'
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-primary/20">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background border-white/10">
        <DialogHeader className="p-6 border-b border-white/10 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Add to Fleet</DialogTitle>
              <DialogDescription>Add new equipment to your rental inventory.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Image Upload Area */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Equipment Image</Label>
            <div className={cn(
              "relative group w-full h-48 rounded-xl border-2 border-dashed transition-all overflow-hidden",
              previewUrl 
                ? "border-primary/50 bg-black/40" 
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            )}>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {previewUrl ? (
                <>
                  <Image src={previewUrl} alt="Preview" fill className="object-contain p-2" />
                  <div className="absolute top-2 right-2 z-20">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        removeImage();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click to upload image</p>
                  <p className="text-xs">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Equipment Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sony A7IV Body"
              required
              className="bg-white/5 border-white/10 focus:border-primary/50 h-11"
            />
          </div>

          {/* Grid: Category & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <Package className="h-3 w-3" /> Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-11">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  <SelectItem value="Camera">Camera</SelectItem>
                  <SelectItem value="Lens">Lens</SelectItem>
                  <SelectItem value="Lighting">Lighting</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <MapPin className="h-3 w-3" /> Store Location
              </Label>
              <Select
                value={formData.store_location}
                onValueChange={(val) => setFormData({ ...formData, store_location: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 h-11">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  <SelectItem value="colombo">Colombo</SelectItem>
                  <SelectItem value="ambalangoda">Ambalangoda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <DollarSign className="h-3 w-3" /> Daily Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rs.</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 pl-10 h-11"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Total Stock
              </Label>
              <Input
                type="number"
                value={formData.quantity_total}
                onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                required
                className="bg-white/5 border-white/10 h-11"
                placeholder="Qty"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <FileText className="h-3 w-3" /> Description
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key specifications, included accessories..."
              className="bg-white/5 border-white/10 min-h-[100px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}