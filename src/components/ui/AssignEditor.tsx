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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateBookingEditor } from "@/lib/actions";

interface AssignEditorProps {
  bookingId: number;
  currentEditor: string | null;
  availableStaff: { id: string; full_name: string }[];
}

export function AssignEditor({ bookingId, currentEditor, availableStaff }: AssignEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<string>(currentEditor || "");

  const handleSave = async () => {
    setLoading(true);
    const res = await updateBookingEditor(bookingId, selectedEditor || null);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Editor Assigned");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
          <UserCog className="h-3 w-3 mr-1" /> 
          {currentEditor ? "Change Editor" : "Assign Editor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Editor</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedEditor} onValueChange={setSelectedEditor} className="gap-3">
            {availableStaff.map((staff) => (
              <div key={staff.id} className="flex items-center space-x-2 border border-white/5 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                <RadioGroupItem value={staff.full_name} id={staff.id} />
                <Label htmlFor={staff.id} className="flex-1 cursor-pointer">{staff.full_name}</Label>
              </div>
            ))}
          </RadioGroup>
          
          {selectedEditor && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4 text-red-400 hover:text-red-300 w-full"
              onClick={() => setSelectedEditor("")}
            >
              Clear Assignment
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}