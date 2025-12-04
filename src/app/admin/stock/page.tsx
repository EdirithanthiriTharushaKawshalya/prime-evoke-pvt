// app/admin/stock/page.tsx
import React from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Droplet, Layers, Frame, Sparkles, MoreVertical } from "lucide-react";
import Link from "next/link";
import { StockItem, Profile } from "@/lib/types";
import { AddStockDialog } from "@/components/ui/AddStockDialog";
import { RestockDialog } from "@/components/ui/RestockDialog";
import { EditStockDialog } from "@/components/ui/EditStockDialog";
import { Badge } from "@/components/ui/badge";
import { StockHistorySheet } from "@/components/admin/stock/StockHistorySheet";
import { RecordWasteDialog } from "@/components/ui/RecordWasteDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function StockPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  const userRole = (profileData as Profile)?.role || 'staff';
  const isManagement = userRole === 'management';

  // 1. Fetch Current Stock
  const { data: stock } = await supabase
    .from("inventory_stock")
    .select("*")
    .order("item_name", { ascending: true });

  const inventory = (stock as StockItem[]) || [];

  // 2. Fetch History Log
  const { data: movements } = await supabase
    .from("inventory_movements")
    .select(`
      *,
      stock_item:inventory_stock(item_name, category),
      user:profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // --- Filtering Categories ---
  const frames = inventory.filter(i => i.category.toLowerCase().includes('frame'));
  const papers = inventory.filter(i => i.category.toLowerCase().includes('paper'));
  const inks = inventory.filter(i => i.category.toLowerCase().includes('ink'));
  const laminations = inventory.filter(i => i.category.toLowerCase().includes('lamination'));
  const others = inventory.filter(i => 
    !frames.includes(i) && 
    !papers.includes(i) && 
    !inks.includes(i) && 
    !laminations.includes(i)
  );

  const StockSection = ({ title, items, icon: Icon }: { title: string, items: StockItem[], icon: React.ElementType }) => (
    <div className="mb-10">
      <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" /> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className={`border-white/10 bg-card/50 backdrop-blur-sm flex flex-col h-full ${
            item.quantity <= item.reorder_level ? 'border-amber-500/50 shadow-amber-500/10 shadow-md' : ''
          }`}>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base md:text-lg font-medium truncate" title={item.item_name}>
                    {item.item_name}
                  </CardTitle>
                  {isManagement && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">Unit: Rs. {item.unit_price.toLocaleString()}</p>
                  )}
                </div>
                {isManagement && (
                  <div className="shrink-0">
                    <EditStockDialog item={item} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 mt-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-2">
                <div>
                  {item.quantity <= item.reorder_level && (
                    <Badge variant="outline" className="mb-2 text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/50 flex gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" /> Low Stock
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">Available</div>
                  <div className={`text-2xl md:text-3xl font-bold ${
                    item.quantity <= item.reorder_level ? 'text-amber-500' : 'text-primary'
                  }`}>
                    {item.quantity}
                  </div>
                </div>
                {isManagement && (
                  <div className="w-full sm:w-auto">
                    <RestockDialog item={item} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-8 text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-white/10">
            No items in {title}.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-4 px-3 md:py-10 md:px-4">
        
        {/* --- Header & Actions --- */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 md:h-10 md:w-10">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-bold leading-tight">Inventory Stock</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Manage frames, papers, inks, and lamination</p>
            </div>
          </div>
          
          {/* --- ACTION BUTTONS (Responsive) --- */}
          {isManagement && (
            <>
              {/* Desktop View: Full Buttons */}
              <div className="hidden lg:flex gap-2">
                 <RecordWasteDialog inventory={inventory} /> 
                 <StockHistorySheet movements={movements || []} />
                 <AddStockDialog />
              </div>

              {/* Mobile View: Dropdown Menu */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-card/50 backdrop-blur-sm border-white/10">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 p-2">
                    {/* We wrap the dialog triggers in a div to prevent closing the menu immediately if needed, 
                        but standard dropdown items usually work best for simple actions. 
                        Since these are Dialog Triggers, we render them directly. 
                    */}
                    <div className="flex flex-col gap-2 [&_button]:w-full [&_button]:justify-start">
                        <RecordWasteDialog inventory={inventory} /> 
                        <StockHistorySheet movements={movements || []} />
                        <AddStockDialog />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* --- Stock Sections --- */}
        <StockSection title="Frames" items={frames} icon={Frame} />
        <StockSection title="Printing Papers" items={papers} icon={Layers} />
        <StockSection title="Ink Bottles" items={inks} icon={Droplet} />
        <StockSection title="Lamination" items={laminations} icon={Sparkles} />
        {others.length > 0 && <StockSection title="Other Items" items={others} icon={Layers} />}

      </div>
      <Footer />
    </div>
  );
}