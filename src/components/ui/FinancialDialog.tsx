// components/ui/FinancialDialog.tsx - Fixed version
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Booking, FinancialEntry, ServicePackage, PhotographerFinancialDetail } from "@/lib/types";
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
import { DollarSign, Calculator, AlertTriangle, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";
import { updateFinancialEntry, updatePhotographerFinancialDetails } from "@/lib/actions";

interface FinancialDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages?: ServicePackage[];
}

export function FinancialDialog({ booking, open, onOpenChange, packages }: FinancialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    package_category: booking.financial_entry?.package_category || booking.event_type || "",
    package_name: booking.financial_entry?.package_name || booking.package_name || "",
    package_amount: booking.financial_entry?.package_amount || 0,
    photographer_expenses: booking.financial_entry?.photographer_expenses || 0,
    videographer_expenses: booking.financial_entry?.videographer_expenses || 0,
    editor_expenses: booking.financial_entry?.editor_expenses || 0,
    editor_name: booking.financial_entry?.editor_name || booking.assigned_editor || "", // <--- Default to assigned editor
    company_expenses: booking.financial_entry?.company_expenses || 0,
    other_expenses: booking.financial_entry?.other_expenses || 0,
    final_amount: booking.financial_entry?.final_amount || 0,
  });

  const [photographerDetails, setPhotographerDetails] = useState<PhotographerFinancialDetail[]>([]);

  // Memoize assigned staff to prevent unnecessary re-renders
  const assignedStaff = useMemo(() => 
    booking.assigned_photographers || [], 
    [JSON.stringify(booking.assigned_photographers)] // Stringify for deep comparison
  );

  // Initialize photographer details only when dialog opens or assigned staff changes
  useEffect(() => {
    if (open && assignedStaff.length > 0) {
      const existingDetails = booking.financial_entry?.photographer_details || [];
      const newDetails: PhotographerFinancialDetail[] = [];
      
      assignedStaff.forEach(staffName => {
        const existing = existingDetails.find(detail => detail.staff_name === staffName);
        if (existing) {
          newDetails.push(existing);
        } else {
          newDetails.push({
            id: 0, // Temporary ID for new entries
            booking_id: booking.id,
            staff_name: staffName,
            amount: 0,
            created_at: new Date().toISOString()
          });
        }
      });
      
      setPhotographerDetails(newDetails);
    } else if (open) {
      setPhotographerDetails([]);
    }
  }, [open, assignedStaff, booking.financial_entry, booking.id]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset form data when dialog closes
      setFormData({
        package_category: booking.financial_entry?.package_category || booking.event_type || "",
        package_name: booking.financial_entry?.package_name || booking.package_name || "",
        package_amount: booking.financial_entry?.package_amount || 0,
        photographer_expenses: booking.financial_entry?.photographer_expenses || 0,
        videographer_expenses: booking.financial_entry?.videographer_expenses || 0,
        editor_expenses: booking.financial_entry?.editor_expenses || 0,
        editor_name: booking.financial_entry?.editor_name || booking.assigned_editor || "", // <--- Reset with assigned editor
        company_expenses: booking.financial_entry?.company_expenses || 0,
        other_expenses: booking.financial_entry?.other_expenses || 0,
        final_amount: booking.financial_entry?.final_amount || 0,
      });

      // Reset photographer details
      const existingDetails = booking.financial_entry?.photographer_details || [];
      const newDetails: PhotographerFinancialDetail[] = [];
      
      assignedStaff.forEach(staffName => {
        const existing = existingDetails.find(detail => detail.staff_name === staffName);
        if (existing) {
          newDetails.push(existing);
        } else {
          newDetails.push({
            id: 0,
            booking_id: booking.id,
            staff_name: staffName,
            amount: 0,
            created_at: new Date().toISOString()
          });
        }
      });
      
      setPhotographerDetails(newDetails);
    }
  }, [open, booking.financial_entry, booking.event_type, booking.package_name, assignedStaff, booking.id, booking.assigned_editor]);

  // Calculate total photographer expenses from individual amounts
  useEffect(() => {
    const totalPhotographerExpenses = photographerDetails.reduce(
      (sum, detail) => sum + (detail.amount || 0), 
      0
    );
    
    setFormData(prev => ({
      ...prev,
      photographer_expenses: totalPhotographerExpenses
    }));
  }, [photographerDetails]);

  // Calculate package amount from actual package price - only run once when dialog opens
  useEffect(() => {
    if (open && packages && booking.package_name && !booking.financial_entry?.package_amount) {
      const selectedPackage = packages.find(pkg => pkg.name === booking.package_name);
      if (selectedPackage && selectedPackage.price) {
        const priceMatch = selectedPackage.price.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const packageAmount = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        
        if (packageAmount > 0) {
          setFormData(prev => ({
            ...prev,
            package_amount: packageAmount,
            package_category: booking.event_type || "",
            package_name: booking.package_name || ""
          }));
        }
      }
    }
  }, [open, booking.package_name, booking.event_type, booking.financial_entry, packages]);

  // Calculate totals
  const totalExpenses = useMemo(() => 
    (formData.photographer_expenses || 0) +
    (formData.videographer_expenses || 0) +
    (formData.editor_expenses || 0) +
    (formData.company_expenses || 0) +
    (formData.other_expenses || 0),
    [formData]
  );

  const isBalanced = totalExpenses === (formData.package_amount || 0);
  const balanceDifference = (formData.package_amount || 0) - totalExpenses;

  // Handle individual photographer amount changes
  const handlePhotographerAmountChange = useCallback((staffName: string, amount: number) => {
    setPhotographerDetails(prev => 
      prev.map(detail => 
        detail.staff_name === staffName 
          ? { ...detail, amount } 
          : detail
      )
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced) {
      toast.error("Expenses Not Balanced", {
        description: `Total expenses (Rs. ${totalExpenses.toLocaleString()}) must equal package amount (Rs. ${formData.package_amount?.toLocaleString()}). Difference: Rs. ${balanceDifference.toLocaleString()}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // First update the main financial entry
      const result = await updateFinancialEntry(booking.id, {
        ...formData,
        // Ensure we save the current editor name, even if it changed from the booking assignment
        editor_name: formData.editor_name || booking.assigned_editor || "Unassigned",
        final_amount: formData.package_amount,
      });
      
      if (result.error) {
        toast.error("Save Failed", {
          description: result.error,
        });
        return;
      }

      // Then update photographer financial details
      const photographerResult = await updatePhotographerFinancialDetails(booking.id, photographerDetails);
      
      if (photographerResult.error) {
        toast.error("Photographer Details Save Failed", {
          description: photographerResult.error,
        });
        return;
      }

      toast.success("Financial Data Saved", {
        description: "The financial details have been successfully updated.",
      });
      onOpenChange(false);
      
    } catch {
      toast.error("Save Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = name.includes('amount') || name.includes('expenses') 
      ? parseFloat(value) || 0 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Details
          </DialogTitle>
          <DialogDescription>
            Manage financial breakdown for {booking.full_name}&apos;s booking.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Package Information */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_category" className="text-right">
                Category
              </Label>
              <Input
                id="package_category"
                name="package_category"
                value={formData.package_category}
                onChange={handleChange}
                className="col-span-3"
                placeholder="e.g., Wedding, Birthday, Event"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_name" className="text-right">
                Package
              </Label>
              <Input
                id="package_name"
                name="package_name"
                value={formData.package_name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="e.g., Premium Wedding, Standard Event"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_amount" className="text-right">
                Package Amount
              </Label>
              <Input
                id="package_amount"
                name="package_amount"
                type="number"
                value={formData.package_amount}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter package amount"
              />
            </div>

            {/* Expenses Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Expenses Breakdown</h4>
              
              {/* Photographer Section with Individual Staff */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Photographer Expenses</Label>
                  <span className="text-sm text-muted-foreground">
                    Total: Rs. {formData.photographer_expenses?.toLocaleString()}
                  </span>
                </div>
                
                {assignedStaff.length > 0 ? (
                  <div className="space-y-2">
                    {photographerDetails.map((detail, index) => (
                      <div key={`${detail.staff_name}-${index}`} className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-5 flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate">{detail.staff_name}</span>
                        </div>
                        <div className="col-span-6">
                          <Input
                            type="number"
                            value={detail.amount || 0}
                            onChange={(e) => handlePhotographerAmountChange(
                              detail.staff_name, 
                              parseFloat(e.target.value) || 0
                            )}
                            placeholder="Enter amount"
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-muted-foreground">
                            Rs. {(detail.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg text-center">
                    No staff assigned to this booking. Assign staff first to set individual payments.
                  </div>
                )}
              </div>

              {/* Other Expenses */}
              <div className="space-y-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="videographer_expenses" className="text-right">
                    Videographer
                  </Label>
                  <Input
                    id="videographer_expenses"
                    name="videographer_expenses"
                    type="number"
                    value={formData.videographer_expenses}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editor_expenses" className="text-right">
                    Editor
                  </Label>
                  
                  {/* Visual Indicator of who is getting paid */}
                  <div className="col-span-3 flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="editor_expenses"
                            name="editor_expenses"
                            type="number"
                            value={formData.editor_expenses}
                            onChange={handleChange}
                            placeholder="0"
                        />
                        {/* Show name badge inside or below input */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            {formData.editor_name || "Unassigned"}
                        </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company_expenses" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company_expenses"
                    name="company_expenses"
                    type="number"
                    value={formData.company_expenses}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="other_expenses" className="text-right">
                    Other
                  </Label>
                  <Input
                    id="other_expenses"
                    name="other_expenses"
                    type="number"
                    value={formData.other_expenses}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className={`p-4 rounded-lg border ${
              isBalanced 
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                : 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Calculator className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className={`text-sm font-semibold ${
                  isBalanced 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-amber-800 dark:text-amber-300'
                }`}>
                  Balance Check
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Package Amount:</div>
                <div className="font-medium text-right">
                  Rs. {(formData.package_amount || 0).toLocaleString()}
                </div>
                
                <div className="text-muted-foreground">Total Expenses:</div>
                <div className="font-medium text-right">
                  Rs. {totalExpenses.toLocaleString()}
                </div>
                
                <div className={`font-semibold ${isBalanced ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  Difference:
                </div>
                <div className={`font-semibold text-right ${
                  isBalanced 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-amber-700 dark:text-amber-400'
                }`}>
                  Rs. {balanceDifference.toLocaleString()}
                </div>
              </div>
              
              {!isBalanced && (
                <div className="flex items-center gap-2 mt-3 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Expenses must equal package amount to save</span>
                </div>
              )}
              
              {isBalanced && (
                <div className="flex items-center gap-2 mt-3 text-green-700 dark:text-green-400 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  <span>Perfectly balanced! Ready to save.</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !isBalanced}
              className={isBalanced ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isLoading ? "Saving..." : "Save Financial Data"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}