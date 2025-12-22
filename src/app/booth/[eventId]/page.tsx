import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Users } from "lucide-react";
import { CreateItemDialog } from "@/components/booth/CreateItemDialog";
import { DeleteItemButton, DeleteEventButton } from "@/components/booth/DeleteButtons"; 
import { BoothLogoutButton } from "@/components/booth/BoothLogoutButton"; // New Import
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getBoothAccess } from "@/lib/booth-auth";

export default async function EventDashboard({ params }: { params: { eventId: string } }) {
  const { eventId } = await params;
  
  // 1. Check Access Level
  const accessLevel = await getBoothAccess(parseInt(eventId));
  const isReadOnly = accessLevel === 'client'; 

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: event } = await supabase.from('booth_events').select('*').eq('id', eventId).single();
  const { data: items } = await supabase.from('booth_items').select('*').eq('event_id', eventId).order('id');

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-6 px-4 md:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Nav Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <Link href="/booth">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold leading-tight">{event?.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                    {isReadOnly ? "Viewer Mode" : "Admin Mode"}
                </p>
              </div>
            </div>

            {/* HEADER ACTIONS: Logout & (Admin Only) Delete Event */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
               <BoothLogoutButton eventId={parseInt(eventId)} />
               
               {!isReadOnly && (
                 <DeleteEventButton eventId={parseInt(eventId)} />
               )}
            </div>
          </div>

          {/* Quick Access "Other Prints" */}
          <Link href={`/booth/${eventId}/other`}>
            <Card className="bg-blue-500/10 border-blue-500/30 mb-8 hover:bg-blue-500/20 transition-colors cursor-pointer backdrop-blur-sm active:scale-[0.99]">
              <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 md:p-6 text-center sm:text-left">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
                  <Printer className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-blue-100">Other / Individual Prints</h2>
                  <p className="text-blue-200/70 text-sm mt-1">Manage ad-hoc prints not related to specific items.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Items Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Event Items</h2>
            
            {!isReadOnly && (
                <div className="w-full sm:w-auto">
                <CreateItemDialog eventId={parseInt(eventId)} />
                </div>
            )}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {items?.map((item) => (
              <Link key={item.id} href={`/booth/${eventId}/item/${item.id}`}>
                <Card className="bg-card/50 border-white/10 hover:border-white/30 hover:bg-white/5 transition-all h-full backdrop-blur-sm active:scale-[0.98] group">
                  <CardHeader className="pb-2 flex flex-row justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base md:text-lg">{item.name}</CardTitle>
                      {item.description && <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                    </div>
                    
                    {!isReadOnly && (
                        <div className="-mt-1 -mr-2">
                            <DeleteItemButton itemId={item.id} eventId={parseInt(eventId)} />
                        </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs md:text-sm text-muted-foreground/70">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-2" /> Open Item
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {items?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-lg text-sm">
                    No items added yet.
                </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}