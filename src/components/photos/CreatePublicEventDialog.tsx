"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createPublicEvent } from "@/lib/actions";
import { createClient } from "@supabase/supabase-js"; // Import Supabase Client

// Initialize Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CreatePublicEventDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null); // State for the image file
  
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    driveLink: "",
    facebookLink: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverImageUrl = "";

      // 1. Upload Image (if selected)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to 'event-covers' bucket
        const { error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error("Image upload failed: " + uploadError.message);
        }

        // Get the Public URL
        const { data: publicData } = supabase.storage
          .from('event-covers')
          .getPublicUrl(fileName);
          
        coverImageUrl = publicData.publicUrl;
      }

      // 2. Save Event to Database
      const res = await createPublicEvent({
        ...formData,
        coverImage: coverImageUrl
      });
      
      if (res.error) {
        throw new Error(res.error);
      }

      toast.success("Event Published to Gallery");
      setOpen(false);
      
      // Reset Form
      setFormData({
        title: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        driveLink: "",
        facebookLink: "",
      });
      setFile(null);

    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish New Event</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a public gallery page for your client.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. John & Jane Wedding" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              className="bg-zinc-900 border-zinc-700 block w-full"
            />
          </div>

          {/* Image Upload Input */}
          <div className="space-y-2">
            <Label htmlFor="cover" className="flex items-center gap-2">
                <ImageIcon className="h-3 w-3" /> Cover Image
            </Label>
            <Input 
              id="cover" 
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="bg-zinc-900 border-zinc-700 cursor-pointer file:text-zinc-400 file:bg-zinc-800 file:border-0 file:rounded-md file:mr-4 file:px-2 file:text-xs hover:file:bg-zinc-700"
            />
            <p className="text-[10px] text-zinc-500">
                Recommended: 1920x1080px (Landscape). Leave empty for auto-generated placeholder.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea 
              id="desc" 
              placeholder="Short message for the guests..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-zinc-900 border-zinc-700 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drive">Google Drive Link</Label>
              <Input 
                id="drive" 
                placeholder="https://drive.google.com/..." 
                value={formData.driveLink}
                onChange={(e) => setFormData({...formData, driveLink: e.target.value})}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb">Facebook Album Link</Label>
              <Input 
                id="fb" 
                placeholder="https://facebook.com/..." 
                value={formData.facebookLink}
                onChange={(e) => setFormData({...formData, facebookLink: e.target.value})}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}