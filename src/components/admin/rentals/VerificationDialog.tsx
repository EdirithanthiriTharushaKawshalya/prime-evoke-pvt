// components/admin/rentals/VerificationDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Eye, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getRentalVerificationDetails, updateRentalVerificationStatus } from "@/lib/actions";
import Image from "next/image";

interface VerificationDialogProps {
  bookingId: number; // FIX: Changed from string to number
  clientName: string;
}

export default function VerificationDialog({ bookingId, clientName }: VerificationDialogProps) {
  const [open, setOpen] = useState(false); // State is handled internally now
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load details when the dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !details) {
      loadDetails();
    }
  };

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      // Convert ID to string for the action if needed, or update action to take number
      const data = await getRentalVerificationDetails(bookingId.toString()); 
      setDetails(data);
    } catch (error) {
      toast.error("Could not load verification details.");
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: 'verified' | 'rejected') => {
    setIsProcessing(true);
    try {
      const res = await updateRentalVerificationStatus(bookingId.toString(), status);
      if (res.success) {
        toast.success(`Booking marked as ${status}`);
        setOpen(false);
      }
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <ShieldAlert className="h-4 w-4 text-yellow-600" />
          Review Docs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify Client: {clientName}</DialogTitle>
          <DialogDescription>Review submitted documents.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : details ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Registered Address</h3>
              <p className="p-3 bg-muted rounded-md">{details.address}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocumentView title="ID Front" src={details.idFrontUrl} />
              <DocumentView title="ID Back" src={details.idBackUrl} />
              <DocumentView title="Selfie" src={details.selfieUrl} />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={() => handleStatusChange('rejected')} disabled={isProcessing}>
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('verified')} disabled={isProcessing}>
            <CheckCircle className="mr-2 h-4 w-4" /> Verify & Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentView({ title, src }: { title: string; src: string }) {
  return (
    <div className="space-y-2 border p-4 rounded-md">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="relative h-64 w-full bg-muted rounded-md overflow-hidden">
        {src ? (
          <Image src={src} alt={title} fill style={{ objectFit: "contain" }} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
        )}
      </div>
      {src && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={src} target="_blank" rel="noopener noreferrer">
            <Eye className="mr-2 h-4 w-4" /> View Fullsize
          </a>
        </Button>
      )}
    </div>
  );
}