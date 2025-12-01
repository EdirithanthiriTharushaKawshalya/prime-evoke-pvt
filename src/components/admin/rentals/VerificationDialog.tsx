// components/admin/rentals/VerificationDialog.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, CheckCircle2, XCircle, Eye, ShieldAlert, 
  MapPin, User, FileText, ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { getRentalVerificationDetails, updateRentalVerificationStatus } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VerificationDialogProps {
  bookingId: number;
  clientName: string;
}

export default function VerificationDialog({ bookingId, clientName }: VerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !details) {
      loadDetails();
    }
  };

  const loadDetails = async () => {
    setIsLoading(true);
    try {
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
        toast.success(status === 'verified' ? "Client verified successfully" : "Verification rejected");
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
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-2 border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
        >
          <ShieldAlert className="h-4 w-4" />
          Review Docs
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 bg-zinc-950 border-white/10 overflow-hidden">
        
        {/* --- HEADER --- */}
        <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Identity Verification</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Review submitted documents for <span className="text-white font-medium">{clientName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching secure documents...</p>
            </div>
          ) : details ? (
            <div className="space-y-8">
              
              {/* Address Section */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" /> Registered Address
                </h3>
                <p className="text-lg text-white font-light pl-6 border-l-2 border-primary/30">
                  {details.address || "No address provided."}
                </p>
              </div>

              {/* Documents Grid */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4" /> Submitted Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DocumentView title="ID Front" src={details.idFrontUrl} />
                  <DocumentView title="ID Back" src={details.idBackUrl} />
                  <DocumentView title="Selfie with ID" src={details.selfieUrl} />
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No details found.
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <DialogFooter className="p-4 border-t border-white/10 bg-zinc-900/50 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
          <div className="text-xs text-muted-foreground hidden sm:block">
            <ShieldAlert className="inline h-3 w-3 mr-1" />
            Actions are logged for security purposes.
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="destructive" 
              onClick={() => handleStatusChange('rejected')} 
              disabled={isProcessing}
              className="flex-1 sm:flex-none bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40"
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button 
              onClick={() => handleStatusChange('verified')} 
              disabled={isProcessing}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Verify & Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentView({ title, src }: { title: string; src: string }) {
  return (
    <div className="group flex flex-col space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-medium text-zinc-300">{title}</span>
        {src && (
           <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">Uploaded</Badge>
        )}
      </div>

      <div className="relative aspect-[4/3] w-full bg-black/40 rounded-xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
        {src ? (
          <>
            <Image 
              src={src} 
              alt={title} 
              fill 
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105" 
            />
            {/* Hover Overlay */}
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm cursor-pointer"
            >
              <Eye className="h-8 w-8 text-white" />
              <span className="text-xs font-medium text-white uppercase tracking-widest">View Fullsize</span>
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
            <FileText className="h-8 w-8 opacity-20" />
            <span className="text-xs">No document</span>
          </div>
        )}
      </div>
      
      {/* Mobile-friendly link for touch devices where hover is tricky */}
      {src && (
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8 md:hidden" asChild>
          <a href={src} target="_blank" rel="noopener noreferrer">
             <ExternalLink className="mr-2 h-3 w-3" /> Open Image
          </a>
        </Button>
      )}
    </div>
  );
}