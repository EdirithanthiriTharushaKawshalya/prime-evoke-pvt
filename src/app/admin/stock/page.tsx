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
import { ArrowLeft, AlertTriangle, Droplet, Layers, Frame, Sparkles } from "lucide-react"; // Added Sparkles for Lamination
import Link from "next/link";
import { StockItem, Profile } from "@/lib/types";
import { AddStockDialog } from "@/components/ui/AddStockDialog";
import { RestockDialog } from "@/components/ui/RestockDialog";
import { EditStockDialog } from "@/components/ui/EditStockDialog";
import { Badge } from "@/components/ui/badge";

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

  const { data: stock } = await supabase
    .from("inventory_stock")
    .select("*")
    .order("item_name", { ascending: true });

  const inventory = (stock as StockItem[]) || [];

  // --- UPDATED CATEGORIES ---
  const frames = inventory.filter(i => i.category.toLowerCase().includes('frame'));
  const papers = inventory.filter(i => i.category.toLowerCase().includes('paper'));
  const inks = inventory.filter(i => i.category.toLowerCase().includes('ink'));
  const laminations = inventory.filter(i => i.category.toLowerCase().includes('lamination')); // New Category
  const others = inventory.filter(i => 
    !frames.includes(i) && 
    !papers.includes(i) && 
    !inks.includes(i) && 
    !laminations.includes(i)
  );

  const StockSection = ({ title, items, icon: Icon }: { title: string, items: StockItem[], icon: React.ElementType }) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" /> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className={`border-white/10 bg-card/50 backdrop-blur-sm ${
            item.quantity <= item.reorder_level ? 'border-amber-500/50 shadow-amber-500/10 shadow-md' : ''
          }`}>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base md:text-lg font-medium">{item.item_name}</CardTitle>
                  {isManagement && (
                    <p className="text-xs text-muted-foreground mt-1">Unit: Rs. {item.unit_price.toLocaleString()}</p>
                  )}
                </div>
                {isManagement && <EditStockDialog item={item} />}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end justify-between mt-2">
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
                  <div>
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
      <div className="container mx-auto py-6 px-4 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Inventory Stock</h1>
              <p className="text-sm text-muted-foreground">Manage frames, papers, inks, and lamination</p>
            </div>
          </div>
          {isManagement && <AddStockDialog />}
        </div>

        <StockSection title="Frames" items={frames} icon={Frame} />
        <StockSection title="Printing Papers" items={papers} icon={Layers} />
        <StockSection title="Ink Bottles" items={inks} icon={Droplet} />
        <StockSection title="Lamination" items={laminations} icon={Sparkles} /> {/* New Section */}
        {others.length > 0 && <StockSection title="Other Items" items={others} icon={Layers} />}

      </div>
      <Footer />
    </div>
  );
}