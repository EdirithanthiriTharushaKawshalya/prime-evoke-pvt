import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OrderTable } from "@/components/booth/OrderTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ItemPage({ params }: { params: { eventId: string; itemId: string } }) {
  const { eventId, itemId } = await params;
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
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/booth/${eventId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{item?.name}</h1>
            <p className="text-zinc-400 text-sm">{item?.description || "Manage print orders for this item"}</p>
          </div>
        </div>

        <OrderTable 
          eventId={parseInt(eventId)} 
          itemId={parseInt(itemId)} 
          initialOrders={orders || []} 
          isOtherCategory={false} // Hide phone column for items
        />
      </div>
    </div>
  );
}