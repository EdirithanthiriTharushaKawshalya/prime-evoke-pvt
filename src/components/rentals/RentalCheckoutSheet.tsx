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
import { Calendar, Trash2, Upload, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { submitRentalBooking } from "@/lib/actions";
import { supabase } from "@/lib/supabaseClient"; // FIX: Use your existing client

interface RentalCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [id: number]: number };
  equipment: RentalEquipment[];
  setCart: (cart: { [id: number]: number }) => void;
}

export function RentalCheckoutSheet({ isOpen, onClose, cart, equipment, setCart }: RentalCheckoutSheetProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    start_date: "",
    end_date: "",
    notes: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
  });

  const selectedItems = equipment.filter(item => cart[item.id]);

  const dailyTotal = selectedItems.reduce((sum, item) => sum + (item.daily_rate * (cart[item.id] || 0)), 0);
  
  const getDaysDiff = () => {
    if (!formData.start_date || !formData.end_date) return 1;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; 
  };

  const totalDays = getDaysDiff();
  const estimatedGrandTotal = dailyTotal * totalDays;

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", { description: "Please upload an image file" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Please upload files smaller than 5MB" });
        return;
      }
      setter(file);
    }
  };

  const uploadFileToStorage = async (file: File, type: string): Promise<string> => {
    // FIX: Using the imported supabase client
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${type}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('private-documents')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    return data.path; // Return the path, not the file name
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);

    try {
      let idFrontPath = "";
      let idBackPath = "";
      let selfiePath = "";

      if (idFrontFile) idFrontPath = await uploadFileToStorage(idFrontFile, 'id_front');
      if (idBackFile) idBackPath = await uploadFileToStorage(idBackFile, 'id_back');
      if (selfieFile) selfiePath = await uploadFileToStorage(selfieFile, 'selfie');

      // FIX: Map to expected Server Action interface
      const orderItems = selectedItems.map(item => ({
        equipmentId: item.id.toString(), // Convert to string for server action
        quantity: cart[item.id]
      }));

      // Combine address
      const fullAddress = `${formData.address_line1}, ${formData.address_line2 ? formData.address_line2 + ', ' : ''}${formData.city}, ${formData.postal_code}`;

      const result = await submitRentalBooking({
        clientName: formData.client_name,
        clientEmail: formData.client_email,
        clientPhone: formData.client_phone,
        startDate: new Date(formData.start_date),
        endDate: new Date(formData.end_date),
        storeId: "colombo", // Default or passed prop
        items: orderItems,
        totalCost: estimatedGrandTotal,
        clientAddress: fullAddress,
        idFrontPath: idFrontPath,
        idBackPath: idBackPath,
        selfiePath: selfiePath,
      });

      if (result.error) {
        toast.error("Booking Failed", { description: result.error });
      } else {
        toast.success("Booking Request Sent!", { 
          description: `Your Booking ID: ${result.bookingId}. We will contact you shortly.` 
        });
        setCart({}); 
        onClose();   
        setStep(1);  
        setFormData({
          client_name: "", client_email: "", client_phone: "",
          start_date: "", end_date: "", notes: "",
          address_line1: "", address_line2: "", city: "", postal_code: "",
        });
        setIdFrontFile(null);
        setIdBackFile(null);
        setSelfieFile(null);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Submission Failed", { 
        description: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ... (Render steps 1, 2, 3 - largely unchanged from your upload, 
  //      just ensure input bindings use formData) ...

  const renderStep1 = () => (
    <div className="space-y-6">
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
                type="button" variant="ghost" size="icon" 
                className="h-6 w-6 text-destructive/70 hover:text-destructive"
                onClick={() => { const newCart = { ...cart }; delete newCart[item.id]; setCart(newCart); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Rental Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input id="start_date" type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input id="end_date" type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
          </div>
        </div>
        <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4"/> Duration</span>
          <span className="font-bold">{totalDays} Days</span>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Rate Total</span>
          <span>Rs. {dailyTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-primary">
          <span>Estimated Total</span>
          <span>Rs. {estimatedGrandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contact Information</h3>
        <div className="space-y-2">
          <Label htmlFor="client_name">Full Name</Label>
          <Input id="client_name" placeholder="Your Name" required value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_email">Email</Label>
            <Input id="client_email" type="email" placeholder="email@example.com" required value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_phone">Phone</Label>
            <Input id="client_phone" type="tel" placeholder="07xxxxxxxx" required value={formData.client_phone} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line1">Address Line 1</Label>
          <Input id="address_line1" placeholder="Street address" required value={formData.address_line1} onChange={(e) => setFormData({...formData, address_line1: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
          <Input id="address_line2" placeholder="Apartment, suite, etc." value={formData.address_line2} onChange={(e) => setFormData({...formData, address_line2: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="City" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input id="postal_code" placeholder="Postal code" required value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Any specific requirements?" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Identity Verification</h3>
        <p className="text-sm text-muted-foreground">Please upload clear photos of your ID documents.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_front">ID Card Front</Label>
            <div className="flex items-center gap-4">
              <Input id="id_front" type="file" accept="image/*" onChange={(e) => handleFileChange(setIdFrontFile, e)} className="flex-1" />
              {idFrontFile && <div className="flex items-center gap-2 text-sm text-green-600"><FileText className="h-4 w-4" /><span>Selected</span></div>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_back">ID Card Back</Label>
            <div className="flex items-center gap-4">
              <Input id="id_back" type="file" accept="image/*" onChange={(e) => handleFileChange(setIdBackFile, e)} className="flex-1" />
              {idBackFile && <div className="flex items-center gap-2 text-sm text-green-600"><FileText className="h-4 w-4" /><span>Selected</span></div>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="selfie">Selfie with ID Card</Label>
            <div className="flex items-center gap-4">
              <Input id="selfie" type="file" accept="image/*" onChange={(e) => handleFileChange(setSelfieFile, e)} className="flex-1" />
              {selfieFile && <div className="flex items-center gap-2 text-sm text-green-600"><FileText className="h-4 w-4" /><span>Selected</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{step === 1 ? "Review" : step === 2 ? "Contact Info" : "Verification"}</SheetTitle>
          <SheetDescription>Step {step} of 3</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          <SheetFooter className="flex gap-2 sm:gap-0">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <Button type="submit" className="flex-1 flex items-center gap-2" disabled={loading || (step === 1 && selectedItems.length === 0)}>
              {loading ? "Processing..." : step === 3 ? <><Upload className="h-4 w-4" /> Submit</> : <><ArrowRight className="h-4 w-4" /> Next</>}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}