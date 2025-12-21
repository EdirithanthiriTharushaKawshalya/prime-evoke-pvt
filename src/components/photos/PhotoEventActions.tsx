"use client";

import { useState } from "react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePublicEvent } from "@/lib/actions";
import { EditPublicEventDialog } from "./EditPublicEventDialog";

export function PhotoEventActions({ event }: { event: any }) {
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    const res = await deletePublicEvent(event.id);
    if (res.error) toast.error(res.error);
    else toast.success("Event deleted");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
          <DropdownMenuItem onClick={() => setShowEdit(true)} className="cursor-pointer text-zinc-300 focus:text-white focus:bg-zinc-900">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-900/20">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPublicEventDialog 
        open={showEdit} 
        onOpenChange={setShowEdit} 
        event={event} 
      />
    </>
  );
}