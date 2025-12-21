import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OrderTable } from "@/components/booth/OrderTable";
import { AddBoothOrderDialog } from "@/components/booth/AddBoothOrderDialog"; // Import new dialog
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function OtherPrintsPage({ params }: { params: { eventId: string } }) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: orders } = await supabase
    .from('booth_orders')
    .select('*')
    .eq('event_id', eventId)
    .is('item_id', null) 
    .order('created_at', { ascending: false });

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* HEADER ROW */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <Link href={`/booth/${eventId}`}>
                <Button variant="ghost" size="icon" className="h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Other / Individual Prints</h1>
                <p className="text-muted-foreground text-sm">Manage ad-hoc photos</p>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:w-auto">
              <AddBoothOrderDialog eventId={parseInt(eventId)} itemId={null} isOtherCategory={true} />
            </div>
          </div>

          <OrderTable 
            eventId={parseInt(eventId)} 
            itemId={null} 
            initialOrders={orders || []} 
            isOtherCategory={true} 
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}