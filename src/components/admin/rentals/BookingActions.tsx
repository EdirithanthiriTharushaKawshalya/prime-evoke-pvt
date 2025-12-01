"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRentalBooking, updateRentalBooking } from "@/lib/actions";
import { RentalBooking } from "@/lib/types";

export function RentalBookingActions({ booking }: { booking: RentalBooking }) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Define the valid status type for clarity
  type BookingStatus = 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
  
  const [formData, setFormData] = useState({
    client_name: booking.client_name,
    client_email: booking.client_email,
    client_phone: booking.client_phone,
    status: booking.status || 'Pending' as BookingStatus
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    const res = await deleteRentalBooking(booking.id);
    if (res.error) toast.error(res.error);
    else {
        toast.success("Booking deleted");
        router.refresh();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateRentalBooking(booking.id, formData);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else {
        toast.success("Booking updated");
        setOpenEdit(false);
        router.refresh();
    }
  };

  return (
    <div className="flex gap-2">
      {/* Edit Button & Dialog */}
      <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
        <Edit className="h-3 w-3 mr-1" /> Edit
      </Button>
      
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Booking {booking.booking_id}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => setFormData({
                    ...formData, 
                    status: val as BookingStatus
                  })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label>Client Name</Label><Input value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.client_phone} onChange={e => setFormData({...formData, client_phone: e.target.value})} /></div>
            <DialogFooter>
                <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4"/> : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Button */}
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}