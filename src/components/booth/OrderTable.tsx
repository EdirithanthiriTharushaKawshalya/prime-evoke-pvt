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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, Edit } from "lucide-react";
import { updateBoothOrderStatus, deleteBoothOrder, updateBoothOrder } from "@/lib/actions";
import { toast } from "sonner";

interface Props {
  eventId: number;
  itemId?: number | null; 
  initialOrders: BoothOrder[];
  isOtherCategory?: boolean;
  isReadOnly?: boolean; // <--- NEW PROP
}

export function OrderTable({ eventId, itemId = null, initialOrders, isOtherCategory = false, isReadOnly = false }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<{id: number, clientName: string, phone: string, photoIds: string} | null>(null);

  const openEditDialog = (order: BoothOrder) => {
    if (isReadOnly) return; // Block edit in read-only
    setEditData({
        id: order.id,
        clientName: order.client_name,
        phone: order.phone_number || "",
        photoIds: order.photo_ids.join(", ") 
    });
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editData) return;
    setLoading(true);
    
    const ids = editData.photoIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    const path = itemId ? `/booth/${eventId}/item/${itemId}` : `/booth/${eventId}/other`;

    const res = await updateBoothOrder(editData.id, {
        client_name: editData.clientName,
        phone_number: editData.phone,
        photo_ids: ids
    }, path);

    setLoading(false);

    if (res.success) {
        toast.success("Order Updated");
        setIsEditOpen(false);
        setEditData(null);
    } else {
        toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if(confirm("Delete this order?")) {
        const path = itemId ? `/booth/${eventId}/item/${itemId}` : `/booth/${eventId}/other`;
        await deleteBoothOrder(id, path);
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    if (isReadOnly) return;
    const path = itemId ? `/booth/${eventId}/item/${itemId}` : `/booth/${eventId}/other`;
    await updateBoothOrderStatus(id, status, path);
  };

  return (
    <div className="space-y-4">
      
      {/* Edit Dialog - Only render if not read only, for safety */}
      {!isReadOnly && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="w-[95vw] max-w-md bg-zinc-950 border-zinc-800 text-white rounded-lg">
                <DialogHeader><DialogTitle>Edit Order</DialogTitle></DialogHeader>
                {editData && (
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                            <Input 
                                value={editData.clientName}
                                onChange={e => setEditData({...editData, clientName: e.target.value})}
                                className="bg-zinc-800 border-zinc-700 h-11"
                            />
                        </div>
                        {isOtherCategory && (
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                            <Input 
                                value={editData.phone}
                                onChange={e => setEditData({...editData, phone: e.target.value})}
                                className="bg-zinc-800 border-zinc-700 h-11"
                            />
                        </div>
                        )}
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Photo IDs</label>
                            <Input 
                                value={editData.photoIds}
                                onChange={e => setEditData({...editData, photoIds: e.target.value})}
                                className="bg-zinc-800 border-zinc-700 h-11"
                                inputMode="numeric"
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Add or remove IDs freely. Separate with commas.</p>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={handleEditSave} disabled={loading} className="w-full h-11 text-base">
                    {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* TABLE */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="whitespace-nowrap">
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                <TableHead className="text-zinc-400 w-[150px]">Name</TableHead>
                {isOtherCategory && <TableHead className="text-zinc-400 w-[120px]">Phone</TableHead>}
                <TableHead className="text-zinc-400 min-w-[150px]">Photo IDs</TableHead>
                <TableHead className="text-zinc-400 w-[140px]">Status</TableHead>
                {/* HIDE ACTIONS COLUMN IF READ ONLY */}
                {!isReadOnly && <TableHead className="text-right text-zinc-400 w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialOrders.map((order) => (
                <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-base">{order.client_name}</TableCell>
                  {isOtherCategory && <TableCell>{order.phone_number || "-"}</TableCell>}
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {order.photo_ids.length > 0 ? order.photo_ids.map((pid, idx) => (
                        <Badge key={idx} variant="outline" className="text-zinc-300 border-zinc-600 bg-zinc-900/50 px-2 py-0.5 text-xs">
                          {pid}
                        </Badge>
                      )) : (
                        <span className="text-zinc-600 text-xs italic">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={isReadOnly} // <--- DISABLE DROPDOWN
                    >
                      <SelectTrigger className={`w-[130px] h-9 border-zinc-700 ${
                        order.status === 'Printed' ? 'text-green-400 bg-green-900/20 border-green-800' :
                        order.status === 'Delivered' ? 'text-blue-400 bg-blue-900/20 border-blue-800' :
                        'bg-transparent'
                      } disabled:opacity-100 disabled:cursor-default`}>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Printed">Printed</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  {/* HIDE ACTION BUTTONS IF READ ONLY */}
                  {!isReadOnly && (
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" 
                                onClick={() => openEditDialog(order)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                onClick={() => handleDelete(order.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {initialOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOtherCategory ? (!isReadOnly ? 5 : 4) : (!isReadOnly ? 4 : 3)} className="text-center h-32 text-zinc-500">
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