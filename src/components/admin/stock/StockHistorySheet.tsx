"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, ArrowUpRight, ArrowDownLeft, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define the shape of the movement data with joined tables
type Movement = {
  id: number;
  created_at: string;
  type: string;
  quantity_change: number;
  new_quantity: number;
  notes: string;
  stock_item: {
    item_name: string;
    category: string;
  };
  user?: {
    full_name: string;
  };
};

export function StockHistorySheet({ movements }: { movements: any[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white">
          <History className="h-4 w-4" /> History Log
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl bg-zinc-950 border-l border-white/10 p-0">
        <SheetHeader className="p-6 border-b border-white/10 bg-zinc-900/50">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Stock History
          </SheetTitle>
          <SheetDescription>
            Timeline of all inventory changes, sales, and restocks.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6 space-y-6">
            {movements.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No history records found.
              </div>
            )}

            {movements.map((move: Movement) => {
              const isPositive = move.quantity_change > 0;
              const isSale = move.type === 'Sale';
              
              return (
                <div key={move.id} className="relative pl-6 border-l border-white/10 pb-6 last:pb-0">
                  {/* Timeline Dot */}
                  <div className={`absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full ${
                    isSale ? 'bg-blue-500' : isPositive ? 'bg-green-500' : 'bg-zinc-500'
                  }`} />

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {move.stock_item?.item_name || "Unknown Item"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(move.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={`
                        ${isSale ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 
                          isPositive ? 'text-green-400 border-green-500/30 bg-green-500/10' : 
                          'text-zinc-400 border-zinc-500/30'}
                      `}>
                        {isPositive ? '+' : ''}{move.quantity_change}
                      </Badge>
                    </div>

                    <div className="bg-white/5 rounded-md p-3 border border-white/5 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          {move.type}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Stock Level: {move.new_quantity}
                        </span>
                      </div>
                      
                      <p className="text-zinc-300 text-xs mb-2">
                        {move.notes || "No notes"}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-2 border-t border-white/5">
                        <User className="h-3 w-3" />
                        {move.user?.full_name ? (
                          <span className="text-zinc-400">{move.user.full_name}</span>
                        ) : (
                          <span className="italic">System / Online Order</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}