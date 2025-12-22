"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Import router
import { deleteBoothEvent, deleteBoothItem } from "@/lib/actions";

export function DeleteEventButton({ eventId }: { eventId: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this WHOLE EVENT? All data will be lost.")) return;
    
    setLoading(true);
    const res = await deleteBoothEvent(eventId);
    
    if (res.error) {
        toast.error(res.error);
        setLoading(false);
    } else {
        toast.success("Event deleted");
        router.push("/booth"); // Redirect to hub
        router.refresh();
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
      Delete Event
    </Button>
  );
}

export function DeleteItemButton({ itemId, eventId }: { itemId: number, eventId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this item? All associated orders will be deleted.")) return;
    
    setLoading(true);
    const res = await deleteBoothItem(itemId, eventId);
    setLoading(false);
    
    if (res.error) toast.error(res.error);
    else toast.success("Item deleted");
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 z-20 relative"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}