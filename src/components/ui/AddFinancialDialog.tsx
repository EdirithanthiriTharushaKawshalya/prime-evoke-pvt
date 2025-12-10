// components/ui/AddFinancialDialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addFinancialRecord } from "@/lib/actions";

interface AddFinancialDialogProps {
  staffMembers: { id: number; name: string }[]; // <--- Props
}

export function AddFinancialDialog({ staffMembers }: AddFinancialDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "Expense",
    category: "",
    amount: "",
    payment_method: "Cash",
    staff_id: "none", // Default
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addFinancialRecord({
        date: formData.date,
        description: formData.description,
        type: formData.type as "Income" | "Expense",
        category: formData.category,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        staff_id: formData.staff_id !== "none" ? parseInt(formData.staff_id) : null,
      });

      if (result.error) {
        toast.error("Failed to add record", { description: result.error });
      } else {
        toast.success("Record Added Successfully");
        setOpen(false);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          description: "",
          type: "Expense",
          category: "",
          amount: "",
          payment_method: "Cash",
          staff_id: "none",
        });
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </DialogTrigger>
      {/* Responsive Content Container */}
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Add Financial Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this for?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Rent, Utilities"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Only show Staff Selector if Type is Expense */}
          {formData.type === "Expense" && (
            <div className="space-y-2">
              <Label>Assign to Staff (Optional)</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(val) => setFormData({...formData, staff_id: val})}
              >
                <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (General Expense)</SelectItem>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}