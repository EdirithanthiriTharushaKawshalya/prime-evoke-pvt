// components/ui/FinancialDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Booking, FinancialEntry, ServicePackage } from "@/lib/types";
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
import { DollarSign, Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updateFinancialEntry } from "@/lib/actions";

interface FinancialDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages?: ServicePackage[]; // Add packages prop to get package prices
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
    company_expenses: booking.financial_entry?.company_expenses || 0,
    other_expenses: booking.financial_entry?.other_expenses || 0,
    final_amount: booking.financial_entry?.final_amount || 0,
  });

  // Calculate package amount from actual package price
  useEffect(() => {
    if (packages && booking.package_name && !booking.financial_entry?.package_amount) {
      const selectedPackage = packages.find(pkg => pkg.name === booking.package_name);
      if (selectedPackage && selectedPackage.price) {
        // Extract numeric value from price string (e.g., "Rs. 250000" -> 250000)
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
  }, [booking.package_name, booking.event_type, booking.financial_entry, packages]);

  // Update form when booking data changes
  useEffect(() => {
    if (booking.financial_entry) {
      setFormData({
        package_category: booking.financial_entry.package_category || booking.event_type || "",
        package_name: booking.financial_entry.package_name || booking.package_name || "",
        package_amount: booking.financial_entry.package_amount || 0,
        photographer_expenses: booking.financial_entry.photographer_expenses || 0,
        videographer_expenses: booking.financial_entry.videographer_expenses || 0,
        editor_expenses: booking.financial_entry.editor_expenses || 0,
        company_expenses: booking.financial_entry.company_expenses || 0,
        other_expenses: booking.financial_entry.other_expenses || 0,
        final_amount: booking.financial_entry.final_amount || 0,
      });
    } else {
      // Set initial values from booking if no financial entry exists
      setFormData(prev => ({
        ...prev,
        package_category: booking.event_type || "",
        package_name: booking.package_name || ""
      }));
    }
  }, [booking.financial_entry, booking.event_type, booking.package_name]);

  // Calculate totals - these will update automatically when formData changes
  const totalExpenses = 
    (formData.photographer_expenses || 0) +
    (formData.videographer_expenses || 0) +
    (formData.editor_expenses || 0) +
    (formData.company_expenses || 0) +
    (formData.other_expenses || 0);

  const isBalanced = totalExpenses === (formData.package_amount || 0);
  const balanceDifference = (formData.package_amount || 0) - totalExpenses;

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
      const result = await updateFinancialEntry(booking.id, {
        ...formData,
        final_amount: formData.package_amount, // Final amount equals package amount when balanced
      });
      
      if (result.error) {
        toast.error("Save Failed", {
          description: result.error,
        });
      } else {
        toast.success("Financial Data Saved", {
          description: "The financial details have been successfully updated.",
        });
        onOpenChange(false);
      }
    } catch {
      toast.error("Save Failed", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = name.includes('amount') || name.includes('expenses') 
      ? parseFloat(value) || 0 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="photographer_expenses" className="text-right">
                  Photographer
                </Label>
                <Input
                  id="photographer_expenses"
                  name="photographer_expenses"
                  type="number"
                  value={formData.photographer_expenses}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="0"
                />
              </div>

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
                <Input
                  id="editor_expenses"
                  name="editor_expenses"
                  type="number"
                  value={formData.editor_expenses}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="0"
                />
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

            {/* Balance Check - Updated Styling */}
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