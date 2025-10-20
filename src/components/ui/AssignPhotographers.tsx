'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type AssignPhotographersProps = {
  bookingId: number;
  userRole: string;
  currentAssignments: string[];
  availableStaff: { id: string; full_name: string }[]; // ✅ use staff naming
};

export function AssignPhotographers({
  bookingId,
  userRole,
  currentAssignments,
  availableStaff,
}: AssignPhotographersProps) {
  const [selected, setSelected] = useState<string[]>(currentAssignments || []);

  const handleToggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Example handler to submit updated staff assignments (if needed)
  const handleSave = async () => {
    try {
      // Your update logic here
      console.log(`Saving staff for booking ${bookingId}:`, selected);
    } catch (err) {
      console.error('Error updating staff assignment:', err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {selected.length > 0 ? `${selected.length} Assigned` : 'Assign Staff'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0">
        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
          {(availableStaff?.length ?? 0) > 0 ? (
            availableStaff.map(
              (staff) =>
                staff.full_name && (
                  <div key={staff.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selected.includes(staff.full_name)}
                      onCheckedChange={() => handleToggle(staff.full_name!)}
                    />
                    <Label>{staff.full_name}</Label>
                  </div>
                )
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No staff available
            </p>
          )}
        </div>
        {userRole === 'management' && (
          <div className="border-t p-2">
            <Button className="w-full" size="sm" onClick={handleSave}>
              Save Assignments
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
