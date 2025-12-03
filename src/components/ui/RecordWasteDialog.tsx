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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordWasteItem } from "@/lib/actions"; // We just created this
import { StockItem } from "@/lib/types";

interface RecordWasteDialogProps {
  inventory: StockItem[];
}

export function RecordWasteDialog({ inventory }: RecordWasteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !quantity || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await recordWasteItem(
        parseInt(selectedItemId), 
        parseInt(quantity), 
        reason
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Waste recorded successfully");
        setOpen(false);
        setQuantity("");
        setReason("");
        setSelectedItemId("");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Filter out items with 0 quantity as you can't waste what you don't have
  const availableItems = inventory.filter(i => i.quantity > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" /> Record Waste
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" /> Record Spoilage
          </DialogTitle>
          <DialogDescription>
            Track damaged or wasted materials. This will deduct from your stock.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {/* Item Selection */}
          <div className="space-y-2">
            <Label>Select Item</Label>
            <Select onValueChange={setSelectedItemId} value={selectedItemId}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Choose material..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 max-h-[200px]">
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.item_name} (Qty: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity Wasted</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 5"
                className="bg-white/5 border-white/10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            
            {/* Common Reasons Dropdown */}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select onValueChange={setReason} value={reason}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="Printer Jam">Printer Jam</SelectItem>
                  <SelectItem value="Color Mismatch">Color Mismatch</SelectItem>
                  <SelectItem value="Damaged Stock">Damaged Stock</SelectItem>
                  <SelectItem value="Test Print">Test Print</SelectItem>
                  <SelectItem value="Cutting Error">Cutting Error</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm Waste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}