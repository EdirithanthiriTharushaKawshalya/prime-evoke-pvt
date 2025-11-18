// components/ui/ProductOrderFinancialDialog.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductOrder, ProductOrderPhotographerCommission } from "@/lib/types";
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
import { 
  updateProductOrderFinancialEntry, 
  updateProductOrderPhotographerCommission 
} from "@/lib/actions";

interface ProductOrderFinancialDialogProps {
  order: ProductOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: any) => void;
}

export function ProductOrderFinancialDialog({ 
  order, 
  open, 
  onOpenChange,
  onSuccess 
}: ProductOrderFinancialDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const financialEntry = order.financial_entry;
  
  const [formData, setFormData] = useState({
    // Logic: If financial entry exists, use that amount. If not, use order total.
    order_amount: financialEntry?.order_amount ?? order.total_amount ?? 0,
    studio_fee: financialEntry?.studio_fee || 0,
    other_expenses: financialEntry?.other_expenses || 0,
    profit: financialEntry?.profit || 0,
  });

  const [photographerDetails, setPhotographerDetails] = useState<ProductOrderPhotographerCommission[]>([]);

  const assignedPhotographers = order.assigned_photographers || [];
  const assignedStaff = useMemo(() => assignedPhotographers, [assignedPhotographers]);

  useEffect(() => {
    if (open) {
      const existingDetails = financialEntry?.photographer_details || [];
      const newDetails: ProductOrderPhotographerCommission[] = [];
      
      assignedStaff.forEach(staffName => {
        const existing = existingDetails.find(detail => detail.staff_name === staffName);
        if (existing) {
          newDetails.push(existing);
        } else {
          newDetails.push({
            id: 0, 
            order_id: order.id,
            staff_name: staffName,
            amount: 0,
            created_at: new Date().toISOString()
          });
        }
      });
      setPhotographerDetails(newDetails);

      setFormData({
        // Logic: Reset to financial amount if exists, else original total
        order_amount: financialEntry?.order_amount ?? order.total_amount ?? 0,
        studio_fee: financialEntry?.studio_fee || 0,
        other_expenses: financialEntry?.other_expenses || 0,
        profit: financialEntry?.profit || 0,
      });
    }
  }, [open, assignedStaff, financialEntry, order.id, order.total_amount]);

  const photographer_commission_total = useMemo(() => 
    photographerDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0),
    [photographerDetails]
  );

  const totalExpenses = useMemo(() => 
    (photographer_commission_total || 0) +
    (formData.studio_fee || 0) +
    (formData.other_expenses || 0) +
    (formData.profit || 0),
    [formData, photographer_commission_total]
  );

  const orderAmount = formData.order_amount || 0;
  const isBalanced = totalExpenses === orderAmount;
  const balanceDifference = orderAmount - totalExpenses;

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
        description: `Total breakdown (Rs. ${totalExpenses.toLocaleString()}) must equal order amount (Rs. ${orderAmount.toLocaleString()}). Difference: Rs. ${balanceDifference.toLocaleString()}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      const mainData = {
        ...formData,
        photographer_commission_total,
      };
      
      const result = await updateProductOrderFinancialEntry(order.id, mainData);
      if (result.error) throw new Error(result.error);

      const photographerResult = await updateProductOrderPhotographerCommission(order.id, photographerDetails);
      if (photographerResult.error) throw new Error(photographerResult.error);

      toast.success("Financial Data Saved", {
        description: "The order financial details have been successfully updated.",
      });

      // 1. OPTIMISTIC UPDATE: Update parent immediately
      if (onSuccess) {
        onSuccess({
           ...mainData,
           photographer_details: photographerDetails
        });
      }

      // 2. Close Dialog
      onOpenChange(false);
      
      // 3. Server Sync (Background)
      router.refresh(); 
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Save Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    
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
            Product Order Financials
          </DialogTitle>
          <DialogDescription>
            Manage financial breakdown for order {order.order_id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Order Amount (Editable) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_amount" className="text-right">
                Order Amount
              </Label>
              <Input
                id="order_amount"
                name="order_amount"
                type="number"
                value={formData.order_amount}
                onChange={handleChange} 
                className="col-span-3" 
              />
            </div>

            {/* Expenses Breakdown Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Expenses Breakdown</h4>
              
              {/* Photographer Commission Section */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Photographer Commission</Label>
                  <span className="text-sm text-muted-foreground">
                    Total: Rs. {photographer_commission_total.toLocaleString()}
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
                        <div className="col-span-7">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg text-center">
                    No staff assigned to this order. Assign staff first to set commission.
                  </div>
                )}
              </div>

              {/* Other Expenses */}
              <div className="space-y-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="studio_fee" className="text-right">
                    Studio Fee
                  </Label>
                  <Input
                    id="studio_fee"
                    name="studio_fee"
                    type="number"
                    value={formData.studio_fee}
                    onChange={handleChange}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="other_expenses" className="text-right">
                    Other Expenses
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

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="profit" className="text-right">
                    Profit
                  </Label>
                  <Input
                    id="profit"
                    name="profit"
                    type="number"
                    value={formData.profit}
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
                ? 'bg-green-50 dark:bg-green-950 dark:border-green-800' 
                : 'bg-amber-50 dark:bg-amber-950 dark:border-amber-800'
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
                <div className="text-muted-foreground">Order Amount:</div>
                <div className="font-medium text-right">
                  Rs. {orderAmount.toLocaleString()}
                </div>
                
                <div className="text-muted-foreground">Total Breakdown:</div>
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
                  <span>Breakdown must equal order amount to save</span>
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