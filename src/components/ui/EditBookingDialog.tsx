// components/ui/EditBookingDialog.tsx - Mobile Responsive Update
"use client";

import { useState } from "react";
import { Booking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { updateBooking } from "@/lib/actions";

interface EditBookingDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBookingDialog({ booking, open, onOpenChange }: EditBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: booking.full_name,
    email: booking.email,
    mobile_number: booking.mobile_number || "",
    event_type: booking.event_type || "",
    package_name: booking.package_name || "",
    event_date: booking.event_date || "",
    message: booking.message || "",
  });

  const formatStudioName = (studioSlug: string) => {
    return studioSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateBooking(booking.id, formData);
      if (result.error) {
        toast.error("Update Failed", { description: result.error });
      } else {
        toast.success("Booking Updated");
        onOpenChange(false);
      }
    } catch {
      toast.error("Update Failed", { description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dialog Container: Full width on mobile, max width on desktop. Max height with scroll. */}
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            {/* Studio Display */}
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
              <Label className="text-sm font-medium">Studio</Label>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {formatStudioName(booking.studio_slug)}
                </Badge>
              </div>
            </div>

            {/* Inputs Stack */}
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="full_name" className="text-xs text-muted-foreground">Full Name</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="h-9 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="mobile_number" className="text-xs text-muted-foreground">Mobile</Label>
                        <Input id="mobile_number" name="mobile_number" type="tel" value={formData.mobile_number} onChange={handleChange} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                         <Label htmlFor="event_date" className="text-xs text-muted-foreground">Date</Label>
                         <Input id="event_date" name="event_date" type="date" value={formData.event_date} onChange={handleChange} className="h-9 text-sm" />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="event_type" className="text-xs text-muted-foreground">Event Type</Label>
                    <Input id="event_type" name="event_type" value={formData.event_type} onChange={handleChange} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="package_name" className="text-xs text-muted-foreground">Package</Label>
                    <Input id="package_name" name="package_name" value={formData.package_name} onChange={handleChange} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="message" className="text-xs text-muted-foreground">Message</Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} className="text-sm min-h-[80px]" />
                </div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">{isLoading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}