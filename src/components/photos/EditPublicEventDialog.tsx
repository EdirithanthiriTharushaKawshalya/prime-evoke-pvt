"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { updatePublicEvent } from "@/lib/actions";
import { createClient } from "@supabase/supabase-js"; // Use direct client for upload

// Initialize client-side supabase for storage upload
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function EditPublicEventDialog({ open, onOpenChange, event }: any) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: event.title,
    date: event.event_date,
    description: event.description,
    driveLink: event.drive_link || "",
    facebookLink: event.facebook_album_link || "",
    coverImage: event.cover_image_url || ""
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.coverImage;

      // 1. Upload new image if selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, file);

        if (uploadError) throw new Error("Image upload failed");
        
        // Get Public URL
        const { data: publicData } = supabase.storage
          .from('event-covers')
          .getPublicUrl(fileName);
          
        imageUrl = publicData.publicUrl;
      }

      // 2. Update Database
      const res = await updatePublicEvent(event.id, {
        ...formData,
        coverImage: imageUrl
      });

      if (res.error) throw new Error(res.error);

      toast.success("Event Updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="bg-zinc-900 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="bg-zinc-900 border-zinc-700" />
          </div>
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex gap-2 items-center">
                <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="bg-zinc-900 border-zinc-700 cursor-pointer" 
                />
            </div>
            {formData.coverImage && !file && <p className="text-xs text-green-500">Current image set.</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-zinc-900 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Drive Link</Label><Input value={formData.driveLink} onChange={(e) => setFormData({...formData, driveLink: e.target.value})} className="bg-zinc-900 border-zinc-700" /></div>
            <div className="space-y-2"><Label>Facebook Link</Label><Input value={formData.facebookLink} onChange={(e) => setFormData({...formData, facebookLink: e.target.value})} className="bg-zinc-900 border-zinc-700" /></div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}