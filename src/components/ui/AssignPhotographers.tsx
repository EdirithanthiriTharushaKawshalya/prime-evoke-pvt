'use client';

// 1. Import useTransition and the Server Action
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { updateBookingAssignments } from '@/lib/actions'; // Import the Server Action
import { toast } from 'sonner'; // For feedback
import { ChevronDown, Users, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        toast.success("Assignments updated successfully!");
        setIsOpen(false); // Close popover on success
      }
    });
  };

  // --- Render Logic ---

  // Read-only view for staff
  if (userRole !== 'management') {
    return (
      <div className="flex flex-wrap gap-1">
        {currentAssignments.length > 0 ? (
          currentAssignments.map((name, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground italic">Unassigned</span>
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
          className="w-full justify-between transition-all duration-200 hover:bg-accent/50 border-2 data-[state=open]:border-primary"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate text-sm font-medium">
              {selected.length > 0 ? (
                <div className="flex items-center gap-1">
                  <span>{selected.length} assigned</span>
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {selected.length}
                  </Badge>
                </div>
              ) : (
                'Assign photographers'
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl shadow-lg border" align="start">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Assign Photographers</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Select team members for this booking
          </p>
        </div>
        
        <ScrollArea className="h-60">
          <div className="p-3 space-y-1">
            {(availableStaff?.length ?? 0) > 0 ? (
              availableStaff.map(
                (staff) =>
                  staff.full_name && (
                    <div
                      key={staff.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        selected.includes(staff.full_name)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => handleToggle(staff.full_name!)}
                    >
                      <div className={`flex items-center justify-center h-5 w-5 rounded border transition-all ${
                        selected.includes(staff.full_name)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}>
                        {selected.includes(staff.full_name) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <Label
                        htmlFor={`staff-${bookingId}-${staff.id}`}
                        className="flex-1 text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {staff.full_name}
                      </Label>
                      <Checkbox
                        id={`staff-${bookingId}-${staff.id}`}
                        checked={selected.includes(staff.full_name)}
                        onCheckedChange={() => handleToggle(staff.full_name!)}
                        disabled={isPending}
                        className="sr-only"
                      />
                    </div>
                  )
              )
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No staff available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All team members are currently assigned
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Save button */}
        <div className="border-t p-4 bg-muted/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Selected</span>
            <Badge variant={selected.length > 0 ? "default" : "secondary"}>
              {selected.length} {selected.length === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          <Button
            className="w-full transition-all duration-200"
            size="sm"
            onClick={handleSave}
            disabled={isPending || selected.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Assignments
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}