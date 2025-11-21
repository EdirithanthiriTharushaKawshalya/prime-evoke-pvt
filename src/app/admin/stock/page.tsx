// app/admin/stock/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { StockItem } from "@/lib/types";
// Make sure to create this component (code below)
import { AddStockDialog } from "@/components/ui/AddStockDialog"; 

export default async function StockPage() {
  // FIX: await cookies()
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: stock } = await supabase
    .from("inventory_stock")
    .select("*")
    .order("category", { ascending: true });

  const inventory = (stock as StockItem[]) || [];

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-3xl font-bold">Inventory Stock</h1>
          </div>
          <AddStockDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => (
            <Card key={item.id} className={`border-white/10 bg-card/50 backdrop-blur-sm ${
              item.quantity <= item.reorder_level ? 'border-amber-500/50 shadow-amber-500/10 shadow-lg' : ''
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.item_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  {item.quantity <= item.reorder_level && (
                    <AlertTriangle className="text-amber-500 h-5 w-5" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className={`text-3xl font-bold ${
                      item.quantity <= item.reorder_level ? 'text-amber-500' : ''
                    }`}>
                      {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                    <p className="text-lg">Rs. {item.unit_price.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}