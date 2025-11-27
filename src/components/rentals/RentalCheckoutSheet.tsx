// components/rentals/RentalCheckoutSheet.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RentalEquipment } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { submitRentalBooking } from "@/lib/actions";

interface RentalCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [id: number]: number };
  equipment: RentalEquipment[];
  setCart: (cart: { [id: number]: number }) => void;
}

export function RentalCheckoutSheet({ isOpen, onClose, cart, equipment, setCart }: RentalCheckoutSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  // Filter selected items from the full list
  const selectedItems = equipment.filter(item => cart[item.id]);

  // Calculations
  const dailyTotal = selectedItems.reduce((sum, item) => sum + (item.daily_rate * (cart[item.id] || 0)), 0);
  
  const getDaysDiff = () => {
    if (!formData.start_date || !formData.end_date) return 1;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Minimum 1 day
  };

  const totalDays = getDaysDiff();
  const estimatedGrandTotal = dailyTotal * totalDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepare items for submission
    const orderItems = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      daily_rate: item.daily_rate,
      quantity: cart[item.id]
    }));

    try {
      const result = await submitRentalBooking({
        ...formData,
        total_amount: estimatedGrandTotal,
        items: orderItems,
      });

      if (result.error) {
        toast.error("Booking Failed", { description: result.error });
      } else {
        toast.success("Booking Request Sent!", { 
          description: `Your Booking ID: ${result.bookingId}. We will contact you shortly.` 
        });
        setCart({}); // Clear cart
        onClose();   // Close sheet
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Complete Your Request</SheetTitle>
          <SheetDescription>
            Confirm your equipment list and rental dates.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Selected Items List */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Your Selection</h3>
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{cart[item.id]} x Rs. {item.daily_rate}</p>
                  </div>
                  <p className="text-sm font-bold mr-3">Rs. {(item.daily_rate * cart[item.id]).toLocaleString()}</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive/70 hover:text-destructive"
                    onClick={() => {
                        const newCart = { ...cart };
                        delete newCart[item.id];
                        setCart(newCart);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Booking Details Form */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Rental Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input 
                  id="start_date" 
                  type="date" 
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input 
                  id="end_date" 
                  type="date" 
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/> Duration</span>
                <span className="font-bold">{totalDays} Days</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Full Name</Label>
              <Input 
                id="client_name" 
                placeholder="Your Name" 
                required 
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="client_email">Email</Label>
                <Input 
                    id="client_email" 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={formData.client_email}
                    onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="client_phone">Phone</Label>
                <Input 
                    id="client_phone" 
                    type="tel" 
                    placeholder="07xxxxxxxx" 
                    required 
                    value={formData.client_phone}
                    onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any specific requirements?"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Rate Total</span>
                <span>Rs. {dailyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
                <span>Estimated Total</span>
                <span>Rs. {estimatedGrandTotal.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground text-right">Final price may vary based on exact return time.</p>
          </div>

          <SheetFooter>
            <Button type="submit" className="w-full" disabled={loading || selectedItems.length === 0}>
              {loading ? "Submitting..." : "Submit Booking Request"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}