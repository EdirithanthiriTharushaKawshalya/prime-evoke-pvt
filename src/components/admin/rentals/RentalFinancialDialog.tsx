// components/admin/rentals/RentalFinancialDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <--- 1. Import useRouter
import { RentalBooking, RentalTeamCommission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateRentalFinancials } from "@/lib/actions";

interface Props {
  rental: RentalBooking;
}

export function RentalFinancialDialog({ rental }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // <--- 2. Initialize router
  
  const fin = rental.financial_entry;
  
  // Initialize main form data from props (Persistence)
  const [formData, setFormData] = useState({
    total_revenue: fin?.total_revenue ?? rental.total_amount ?? 0,
    delivery_expenses: fin?.delivery_expenses || 0,
    maintenance_expenses: fin?.maintenance_expenses || 0,
    other_expenses: fin?.other_expenses || 0,
  });

  const [teamCommissions, setTeamCommissions] = useState<RentalTeamCommission[]>([]);

  // Initialize commissions based on assigned team AND saved details
  useEffect(() => {
    if(open) {
      const savedDetails = fin?.team_details || [];
      const assignedMembers = rental.assigned_team_members || [];
      
      const combined = assignedMembers.map(name => {
        const found = savedDetails.find(e => e.staff_name === name);
        return found || { 
            id: 0, 
            created_at: '', 
            rental_id: rental.id, 
            staff_name: name, 
            amount: 0 
        };
      });
      
      setTeamCommissions(combined);
      
      setFormData({
        total_revenue: fin?.total_revenue ?? rental.total_amount ?? 0,
        delivery_expenses: fin?.delivery_expenses || 0,
        maintenance_expenses: fin?.maintenance_expenses || 0,
        other_expenses: fin?.other_expenses || 0,
      });
    }
  }, [open, rental, fin]);

  const commissionTotal = teamCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const totalExpenses = commissionTotal + formData.delivery_expenses + formData.maintenance_expenses + formData.other_expenses;
  const profit = formData.total_revenue - totalExpenses;

  const handleSave = async () => {
    setLoading(true);
    const res = await updateRentalFinancials(
      rental.id,
      {
        ...formData,
        profit,
        team_commission_total: commissionTotal
      },
      teamCommissions
    );
    setLoading(false);
    
    if(res.error) {
      toast.error(res.error);
    } else {
      toast.success("Financials Saved");
      setOpen(false);
      router.refresh(); // <--- 3. Refresh page to update card total
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-green-600 border-green-600/20 hover:bg-green-50">
          <DollarSign className="h-3 w-3 mr-1" /> Financials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Rental Financials</DialogTitle></DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Revenue */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Revenue</Label>
            <Input 
              type="number" 
              value={formData.total_revenue} 
              onChange={e => setFormData({...formData, total_revenue: parseFloat(e.target.value) || 0})}
              className="col-span-3 font-bold"
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Team Commissions</h4>
            {teamCommissions.length === 0 && <p className="text-xs text-muted-foreground">No team members assigned.</p>}
            {teamCommissions.map((comm, idx) => (
              <div key={idx} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs truncate">{comm.staff_name}</Label>
                <Input 
                  type="number" 
                  value={comm.amount} 
                  onChange={e => {
                    const newComms = [...teamCommissions];
                    newComms[idx].amount = parseFloat(e.target.value) || 0;
                    setTeamCommissions(newComms);
                  }}
                  className="col-span-3 h-8"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Other Expenses</h4>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label className="text-xs">Delivery</Label>
                 <Input type="number" value={formData.delivery_expenses} onChange={e => setFormData({...formData, delivery_expenses: parseFloat(e.target.value)||0})} />
               </div>
               <div>
                 <Label className="text-xs">Maintenance</Label>
                 <Input type="number" value={formData.maintenance_expenses} onChange={e => setFormData({...formData, maintenance_expenses: parseFloat(e.target.value)||0})} />
               </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Other</Label>
                <Input className="col-span-3 h-8" type="number" value={formData.other_expenses} onChange={e => setFormData({...formData, other_expenses: parseFloat(e.target.value)||0})} />
             </div>
          </div>

          {/* Summary Box */}
          <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
             <div className="flex justify-between text-sm">
               <span>Total Expenses</span>
               <span className="text-red-500">- Rs. {totalExpenses.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
               <span>Net Profit</span>
               <span className={profit >= 0 ? "text-green-500" : "text-red-500"}>
                 Rs. {profit.toLocaleString()}
               </span>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Financial Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}