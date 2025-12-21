"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { deleteBoothEvent, deleteBoothItem } from "@/lib/actions";

export function DeleteEventButton({ eventId }: { eventId: number }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    if (!confirm("Are you sure you want to delete this event? All items and orders inside will be lost.")) return;
    
    setLoading(true);
    const res = await deleteBoothEvent(eventId);
    setLoading(false);
    
    if (res.error) toast.error(res.error);
    else toast.success("Event deleted");
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