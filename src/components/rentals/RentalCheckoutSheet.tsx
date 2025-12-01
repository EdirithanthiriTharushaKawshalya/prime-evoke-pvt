// components/rentals/RentalCheckoutSheet.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RentalEquipment } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, Trash2, Upload, ArrowLeft, ArrowRight, 
  Loader2, CheckCircle2, MapPin, ShieldCheck, ImageIcon, CreditCard 
} from "lucide-react";
import { toast } from "sonner";
import { submitRentalBooking } from "@/lib/actions";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RentalCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [id: number]: number };
  equipment: RentalEquipment[];
  setCart: (cart: { [id: number]: number }) => void;
  storeId: string;
}

export function RentalCheckoutSheet({ 
  isOpen, 
  onClose, 
  cart, 
  equipment, 
  setCart, 
  storeId 
}: RentalCheckoutSheetProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // File States
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

  // --- Helpers ---

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

  const uploadFileToStorage = async (file: File, folderId: string, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `verifications/${folderId}/${type}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('private-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(`Failed to upload ${type}: ${error.message}`);
    return data.path; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);

    try {
      const submissionFolderId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let idFrontPath = "", idBackPath = "", selfiePath = "";

      if (idFrontFile) idFrontPath = await uploadFileToStorage(idFrontFile, submissionFolderId, 'id_front');
      if (idBackFile) idBackPath = await uploadFileToStorage(idBackFile, submissionFolderId, 'id_back');
      if (selfieFile) selfiePath = await uploadFileToStorage(selfieFile, submissionFolderId, 'selfie');

      const orderItems = selectedItems.map(item => ({
        equipmentId: item.id.toString(),
        quantity: cart[item.id]
      }));

      const fullAddress = `${formData.address_line1}, ${formData.address_line2 ? formData.address_line2 + ', ' : ''}${formData.city}, ${formData.postal_code}`;

      const result = await submitRentalBooking({
        clientName: formData.client_name,
        clientEmail: formData.client_email,
        clientPhone: formData.client_phone,
        startDate: new Date(formData.start_date),
        endDate: new Date(formData.end_date),
        storeId: storeId,
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
        toast.success("Request Sent Successfully!", { 
          description: `Booking ID: ${result.bookingId}. We will contact you shortly.` 
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
      toast.error("Submission Failed", { 
        description: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  // --- Steps UI ---

  const renderProgress = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-in-out", 
              step >= s ? "bg-primary w-full" : "w-0"
            )} 
          />
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground uppercase tracking-wider">
           <CreditCard className="h-4 w-4" /> Your Selection
        </h3>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedItems.map((item) => (
            <div key={item.id} className="group flex gap-3 items-center bg-card/50 border border-white/5 p-2 rounded-xl transition-all hover:bg-card/80">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/20">
                 {item.image_url ? (
                   <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                 ) : (
                   <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-5 w-5 opacity-20"/></div>
                 )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{item.category}</Badge>
                   <p className="text-xs text-muted-foreground">Qty: {cart[item.id]}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold">Rs. {(item.daily_rate * cart[item.id]).toLocaleString()}</p>
                <Button 
                  type="button" variant="ghost" size="icon" 
                  className="h-6 w-6 mt-1 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => { const newCart = { ...cart }; delete newCart[item.id]; setCart(newCart); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {selectedItems.length === 0 && <p className="text-center text-muted-foreground py-8">Your cart is empty.</p>}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground uppercase tracking-wider">
          <Calendar className="h-4 w-4" /> Rental Dates
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-xs">Pickup Date</Label>
            <Input 
                id="start_date" type="date" required 
                className="bg-white/5 border-white/10"
                value={formData.start_date} 
                onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-xs">Return Date</Label>
            <Input 
                id="end_date" type="date" required 
                className="bg-white/5 border-white/10"
                value={formData.end_date} 
                onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
            />
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Rate</span>
          <span>Rs. {dailyTotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span>{totalDays} Days</span>
        </div>
        <Separator className="bg-primary/20 my-2" />
        <div className="flex justify-between text-lg font-bold text-primary">
          <span>Estimated Total</span>
          <span>Rs. {estimatedGrandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground uppercase tracking-wider">
          <MapPin className="h-4 w-4" /> Contact & Billing
        </h3>
        
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="client_name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="client_name" className="bg-white/5 border-white/10" placeholder="e.g. John Doe" required value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="client_email" className="text-xs text-muted-foreground">Email</Label>
                    <Input id="client_email" type="email" className="bg-white/5 border-white/10" placeholder="john@example.com" required value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="client_phone" className="text-xs text-muted-foreground">Mobile</Label>
                    <Input id="client_phone" type="tel" className="bg-white/5 border-white/10" placeholder="07xxxxxxxx" required value={formData.client_phone} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="address_line1" className="text-xs text-muted-foreground">Address</Label>
                <Input id="address_line1" className="bg-white/5 border-white/10" placeholder="House No, Street Name" required value={formData.address_line1} onChange={(e) => setFormData({...formData, address_line1: e.target.value})} />
                <Input id="address_line2" className="bg-white/5 border-white/10 mt-2" placeholder="Apartment, Area (Optional)" value={formData.address_line2} onChange={(e) => setFormData({...formData, address_line2: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                    <Input id="city" className="bg-white/5 border-white/10" required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="text-xs text-muted-foreground">Postal Code</Label>
                    <Input id="postal_code" className="bg-white/5 border-white/10" required value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} />
                </div>
            </div>
        </div>

        <div className="space-y-1.5 pt-2">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">Additional Notes</Label>
            <Textarea id="notes" className="bg-white/5 border-white/10 resize-none" placeholder="Special requirements or questions?" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>
      </div>
    </div>
  );

  const FileUploader = ({ label, file, setFile }: { label: string, file: File | null, setFile: React.Dispatch<React.SetStateAction<File | null>> }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className={cn(
        "relative flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed transition-all",
        file 
          ? "border-green-500/50 bg-green-500/5" 
          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
      )}>
        <input 
          type="file" 
          accept="image/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={(e) => handleFileChange(setFile, e)} 
        />
        {file ? (
          <div className="flex items-center gap-2 text-green-500">
             <CheckCircle2 className="h-5 w-5" />
             <div className="text-center">
               <p className="text-sm font-medium">Attached</p>
               <p className="text-[10px] opacity-70 truncate max-w-[150px]">{file.name}</p>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
             <Upload className="h-5 w-5 mb-1" />
             <p className="text-xs">Click to Upload</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" /> Identity Verification
        </h3>
        <p className="text-sm text-muted-foreground bg-blue-500/10 text-blue-400 p-3 rounded-lg border border-blue-500/20">
            For security, please upload clear photos of your ID. Data is deleted after verification.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
           <FileUploader label="ID Front" file={idFrontFile} setFile={setIdFrontFile} />
           <FileUploader label="ID Back" file={idBackFile} setFile={setIdBackFile} />
        </div>
        <FileUploader label="Selfie with ID" file={selfieFile} setFile={setSelfieFile} />
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* ADDED PADDING HERE: px-6 py-6 */}
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-zinc-950 border-l border-white/10 px-6 py-6 sm:px-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl">
             {step === 1 ? "Order Summary" : step === 2 ? "Your Details" : "Verification"}
          </SheetTitle>
          <SheetDescription>
             Complete the steps to request your booking.
          </SheetDescription>
        </SheetHeader>
        
        {renderProgress()}

        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          
          {/* ADJUSTED FOOTER: Sticky with negative margin to full width */}
          <SheetFooter className="flex gap-3 sm:gap-3 pt-4 sticky bottom-0 bg-zinc-950 z-20 -mx-6 px-6 pb-6 border-t border-white/5">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="flex-1 bg-white/5 border-white/10 hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            )}
            <Button 
              type="submit" 
              className={cn("flex-1 font-bold", step === 1 && "w-full")} 
              disabled={loading || (step === 1 && selectedItems.length === 0)}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2"/> Processing...</> 
              ) : step === 3 ? (
                <><Upload className="h-4 w-4 mr-2" /> Submit Request</> 
              ) : (
                <><span className="mr-2">Continue</span> <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}