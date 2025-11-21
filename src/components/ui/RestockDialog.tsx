// components/ui/RestockDialog.tsx
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { restockItem } from "@/lib/actions";
import { StockItem } from "@/lib/types";

interface RestockDialogProps {
  item: StockItem;
}

export function RestockDialog({ item }: RestockDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const qtyToAdd = parseInt(amount);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error("Please enter a valid positive number");
      setLoading(false);
      return;
    }

    try {
      const result = await restockItem(item.id, qtyToAdd, item.quantity);

      if (result.error) {
        toast.error("Restock Failed", { description: result.error });
      } else {
        toast.success("Stock Updated", { description: `Added ${qtyToAdd} units to ${item.item_name}` });
        setOpen(false);
        setAmount("");
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
        <Button size="sm" variant="outline" className="w-full sm:w-auto border-green-600/50 text-green-600 hover:bg-green-50">
          <PlusCircle className="h-4 w-4 mr-2" /> Restock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock {item.item_name}</DialogTitle>
          <DialogDescription>
            Current Quantity: <span className="font-bold text-foreground">{item.quantity}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Add Qty</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g. 50"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? "Updating..." : "Confirm Restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}