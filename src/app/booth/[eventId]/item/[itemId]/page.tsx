import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OrderTable } from "@/components/booth/OrderTable";
import { AddBoothOrderDialog } from "@/components/booth/AddBoothOrderDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBoothAccess } from "@/lib/booth-auth";

export default async function ItemPage({ params }: { params: { eventId: string; itemId: string } }) {
  const { eventId, itemId } = await params;
  
  // 1. Check Access
  const accessLevel = await getBoothAccess(parseInt(eventId));
  const isReadOnly = accessLevel === 'client';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: item } = await supabase.from('booth_items').select('*').eq('id', itemId).single();
  const { data: orders } = await supabase
    .from('booth_orders')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href={`/booth/${eventId}`}>
                <Button variant="ghost" size="icon" className="h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{item?.name}</h1>
                <p className="text-muted-foreground text-sm">{item?.description || "Manage print orders for this item"}</p>
              </div>
            </div>

            {/* HIDE ADD BUTTON IF READ ONLY */}
            {!isReadOnly && (
                <div className="w-full md:w-auto">
                <AddBoothOrderDialog eventId={parseInt(eventId)} itemId={parseInt(itemId)} isOtherCategory={false} />
                </div>
            )}
          </div>

          <OrderTable 
            eventId={parseInt(eventId)} 
            itemId={parseInt(itemId)} 
            initialOrders={orders || []} 
            isOtherCategory={false} 
            isReadOnly={isReadOnly} // <--- Pass Prop
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}