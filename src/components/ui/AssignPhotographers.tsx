'use client';

// 1. Import useTransition and the Server Action
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { updateBookingAssignments } from '@/lib/actions'; // Import the Server Action
import { toast } from 'sonner'; // For feedback
import { ChevronsUpDown } from 'lucide-react';

type StaffMember = {
  id: string;
  full_name: string | null;
};

type AssignPhotographersProps = {
  bookingId: number;
  userRole: string;
  currentAssignments: string[];
  availableStaff: StaffMember[];
};

export function AssignPhotographers({
  bookingId,
  userRole,
  currentAssignments,
  availableStaff,
}: AssignPhotographersProps) {
  const [selected, setSelected] = useState<string[]>(currentAssignments || []);
  const [isOpen, setIsOpen] = useState(false);
  // 2. Add useTransition hook for loading state
  const [isPending, startTransition] = useTransition();

  const handleToggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // 3. Update handleSave to call the Server Action
  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBookingAssignments(bookingId, selected);
      if (result?.error) {
        toast.error("Failed to update assignments", { description: result.error });
      } else {
        toast.success("Assignments updated!");
        setIsOpen(false); // Close popover on success
      }
    });
  };

  // --- Render Logic ---

  // Read-only view for staff
  if (userRole !== 'management') {
    return (
      <div>
        {currentAssignments.length > 0 ? (
          currentAssignments.join(', ')
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </div>
    );
  }

  // Management view with Popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between text-xs h-8"
        >
          <span className='truncate'>
            {selected.length > 0 ? selected.join(', ') : 'Assign Staff'}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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
                      id={`staff-${bookingId}-${staff.id}`} // Unique ID
                      checked={selected.includes(staff.full_name)}
                      onCheckedChange={() => handleToggle(staff.full_name!)}
                      disabled={isPending} // Disable while saving
                    />
                    <Label
                      htmlFor={`staff-${bookingId}-${staff.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {staff.full_name}
                    </Label>
                  </div>
                )
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No staff available
            </p>
          )}
        </div>
        {/* Only show Save button for management */}
        <div className="border-t p-2 flex justify-end">
          <Button
            className="w-full"
            size="sm"
            onClick={handleSave}
            disabled={isPending} // Disable while saving
          >
            {isPending ? "Saving..." : "Save Assignments"} {/* Show loading text */}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}