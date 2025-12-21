"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { addBoothOrder } from "@/lib/actions";
import { toast } from "sonner";

interface Props {
  eventId: number;
  itemId?: number | null; 
  isOtherCategory?: boolean;
}

export function AddBoothOrderDialog({ eventId, itemId = null, isOtherCategory = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", phone: "", photoIds: "" });

  const handleAdd = async () => {
    setLoading(true);
    // Logic: Split by comma/space -> Clean whitespace -> Remove empty strings
    const ids = formData.photoIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    
    const res = await addBoothOrder({
      event_id: eventId,
      item_id: itemId,
      client_name: formData.clientName,
      phone_number: formData.phone,
      photo_ids: ids
    });

    setLoading(false);

    if (res.success) {
      toast.success("Order Added");
      setIsOpen(false);
      setFormData({ clientName: "", phone: "", photoIds: "" });
    } else {
      toast.error("Failed to add order");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/20 w-full md:w-auto">
          <Plus className="h-5 w-5 mr-2" /> Add New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md bg-zinc-950 border-zinc-800 text-white rounded-lg">
        <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <Input 
              placeholder="e.g. John Doe" 
              value={formData.clientName}
              onChange={e => setFormData({...formData, clientName: e.target.value})}
              className="bg-zinc-800 border-zinc-700 h-11"
            />
          </div>
          
          {isOtherCategory && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
              <Input 
                placeholder="e.g. 077..." 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="bg-zinc-800 border-zinc-700 h-11"
                type="tel"
              />
            </div>
          )}
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Photo IDs</label>
            <Input 
              placeholder="e.g. 1045, 1046" 
              value={formData.photoIds}
              onChange={e => setFormData({...formData, photoIds: e.target.value})}
              className="bg-zinc-800 border-zinc-700 h-11"
              inputMode="numeric" 
            />
            <p className="text-[10px] text-zinc-500 mt-1">Leave empty for none. Separate multiple with commas or spaces.</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={loading} className="w-full h-11 text-base">
            {loading ? <Loader2 className="animate-spin" /> : "Save Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}