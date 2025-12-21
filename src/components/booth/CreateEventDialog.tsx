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
import { Plus, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { createBoothEvent } from "@/lib/actions";

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Default to today's date
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await createBoothEvent(formData.name, formData.date);
    
    setLoading(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Event Created");
      setOpen(false);
      setFormData({ name: "", date: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-zinc-200">
          <Plus className="h-4 w-4 mr-2" /> New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Add a new event to manage photo booth orders.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Preschool Annual Concert" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="bg-zinc-900 border-zinc-700 focus:border-zinc-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                id="date" 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
                className="pl-9 bg-zinc-900 border-zinc-700 focus:border-zinc-500 block w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}