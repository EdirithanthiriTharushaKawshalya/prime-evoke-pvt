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
import { Trash2, Edit, CheckCircle, Clock, Truck } from "lucide-react";
import { addBoothOrder, updateBoothOrderStatus, deleteBoothOrder, updateBoothOrder } from "@/lib/actions";
import { toast } from "sonner";

interface Props {
  eventId: number;
  itemId?: number | null; // Null if "Other"
  initialOrders: BoothOrder[];
  isOtherCategory?: boolean; // If true, show phone number column
}

export function OrderTable({ eventId, itemId = null, initialOrders, isOtherCategory = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  // Add Order Form State
  const [formData, setFormData] = useState({ clientName: "", phone: "", photoIds: "" });
  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<BoothOrder | null>(null);

  const handleAdd = async () => {
    // Split IDs by comma or space
    const ids = formData.photoIds.split(/[\s,]+/).filter(Boolean);
    
    const res = await addBoothOrder({
      event_id: eventId,
      item_id: itemId,
      client_name: formData.clientName,
      phone_number: formData.phone,
      photo_ids: ids
    });

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
          <Button className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto h-12 text-lg">
            + Add New Client
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Full Name" 
              value={formData.clientName}
              onChange={e => setFormData({...formData, clientName: e.target.value})}
              className="bg-zinc-800 border-zinc-700"
            />
            {isOtherCategory && (
              <Input 
                placeholder="Phone Number" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            )}
            <Input 
              placeholder="Photo IDs (e.g. 1045, 1046)" 
              value={formData.photoIds}
              onChange={e => setFormData({...formData, photoIds: e.target.value})}
              className="bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-zinc-500">Separate multiple IDs with commas.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Save Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TABLE */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Name</TableHead>
              {isOtherCategory && <TableHead className="text-zinc-400">Phone</TableHead>}
              <TableHead className="text-zinc-400">Photo IDs</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialOrders.map((order) => (
              <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-medium">{order.client_name}</TableCell>
                {isOtherCategory && <TableCell>{order.phone_number || "-"}</TableCell>}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {order.photo_ids.map((pid, idx) => (
                      <Badge key={idx} variant="outline" className="text-zinc-300 border-zinc-600">
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
                    <SelectTrigger className="w-[110px] h-8 bg-transparent border-zinc-700">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(order.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {initialOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOtherCategory ? 5 : 4} className="text-center h-24 text-zinc-500">
                  No orders added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}