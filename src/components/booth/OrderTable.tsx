"use client";

import { useState } from "react";
import { BoothOrder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { addBoothOrder, updateBoothOrderStatus, deleteBoothOrder } from "@/lib/actions";
import { toast } from "sonner";

interface Props {
  eventId: number;
  itemId?: number | null; // Null if "Other"
  initialOrders: BoothOrder[];
  isOtherCategory?: boolean; // If true, show phone number column
}

export function OrderTable({ eventId, itemId = null, initialOrders, isOtherCategory = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", phone: "", photoIds: "" });

  const handleAdd = async () => {
    setLoading(true);
    // Split IDs by comma or space
    const ids = formData.photoIds.split(/[\s,]+/).filter(Boolean);
    
    const res = await addBoothOrder({
      event_id: eventId,
      item_id: itemId,
      client_name: formData.clientName,
      phone_number: formData.phone,
      photo_ids: ids
    });

    setLoading(false);

    if (res.success) {
      toast.success("Order Added");
      setIsOpen(false);
      setFormData({ clientName: "", phone: "", photoIds: "" });
    } else {
      toast.error("Failed to add order");
    }
  };

  const handleDelete = async (id: number) => {
    if(confirm("Delete this order?")) {
        const path = itemId ? `/booth/${eventId}/item/${itemId}` : `/booth/${eventId}/other`;
        await deleteBoothOrder(id, path);
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    const path = itemId ? `/booth/${eventId}/item/${itemId}` : `/booth/${eventId}/other`;
    await updateBoothOrderStatus(id, status, path);
  };

  return (
    <div className="space-y-4">
      {/* ADD BUTTON DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto h-11 text-base font-medium shadow-md shadow-green-900/20">
            <Plus className="h-5 w-5 mr-2" /> Add New Client
          </Button>
        </DialogTrigger>
        {/* Responsive Dialog Content */}
        <DialogContent className="w-[95vw] max-w-md bg-zinc-950 border-zinc-800 text-white rounded-lg">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <Input 
                placeholder="e.g. John Doe" 
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
                className="bg-zinc-800 border-zinc-700 h-11"
              />
            </div>
            
            {isOtherCategory && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                <Input 
                  placeholder="e.g. 077..." 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 h-11"
                  type="tel"
                />
              </div>
            )}
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Photo IDs</label>
              <Input 
                placeholder="e.g. 1045, 1046" 
                value={formData.photoIds}
                onChange={e => setFormData({...formData, photoIds: e.target.value})}
                className="bg-zinc-800 border-zinc-700 h-11"
                inputMode="numeric" // Helps on mobile
              />
              <p className="text-[10px] text-zinc-500 mt-1">Separate multiple IDs with commas or spaces.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={loading} className="w-full h-11 text-base">
              {loading ? <Loader2 className="animate-spin" /> : "Save Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TABLE - WRAPPED FOR HORIZONTAL SCROLL */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                <TableHead className="text-zinc-400 w-[150px]">Name</TableHead>
                {isOtherCategory && <TableHead className="text-zinc-400 w-[120px]">Phone</TableHead>}
                <TableHead className="text-zinc-400 min-w-[150px]">Photo IDs</TableHead>
                <TableHead className="text-zinc-400 w-[140px]">Status</TableHead>
                <TableHead className="text-right text-zinc-400 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialOrders.map((order) => (
                <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-base">{order.client_name}</TableCell>
                  {isOtherCategory && <TableCell>{order.phone_number || "-"}</TableCell>}
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {order.photo_ids.map((pid, idx) => (
                        <Badge key={idx} variant="outline" className="text-zinc-300 border-zinc-600 bg-zinc-900/50 px-2 py-0.5 text-xs">
                          {pid}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                    >
                      <SelectTrigger className={`w-[130px] h-9 border-zinc-700 ${
                        order.status === 'Printed' ? 'text-green-400 bg-green-900/20 border-green-800' :
                        order.status === 'Delivered' ? 'text-blue-400 bg-blue-900/20 border-blue-800' :
                        'bg-transparent'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Printed">Printed</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                        onClick={() => handleDelete(order.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {initialOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOtherCategory ? 5 : 4} className="text-center h-32 text-zinc-500">
                    No orders added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}