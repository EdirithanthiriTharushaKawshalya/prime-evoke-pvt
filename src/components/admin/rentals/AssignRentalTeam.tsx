// components/admin/rentals/AssignRentalTeam.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateRentalAssignments } from "@/lib/actions";

interface AssignRentalTeamProps {
  rentalId: number;
  currentAssignments: string[];
  availableStaff: { id: string; full_name: string }[]; 
}

export function AssignRentalTeam({ rentalId, currentAssignments, availableStaff }: AssignRentalTeamProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Sync state when dialog opens or props change
  useEffect(() => {
    if (isOpen) {
        setSelected(currentAssignments || []);
    }
  }, [isOpen, currentAssignments]);

  const handleToggle = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateRentalAssignments(rentalId, selected);
    setLoading(false);
    if(res.error) toast.error(res.error);
    else {
      toast.success("Team Assigned");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Users className="h-3 w-3 mr-1" /> Assign Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign Team</DialogTitle></DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          {availableStaff.map(staff => (
            <div key={staff.id} className="flex items-center gap-2">
              <Checkbox 
                id={`rt-${staff.id}`} 
                checked={selected.includes(staff.full_name)}
                onCheckedChange={() => handleToggle(staff.full_name)}
              />
              <Label htmlFor={`rt-${staff.id}`}>{staff.full_name}</Label>
            </div>
          ))}
          {availableStaff.length === 0 && (
            <p className="text-sm text-muted-foreground">No staff members found.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4"/> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}