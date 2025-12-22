import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { CreateEventDialog } from "@/components/booth/CreateEventDialog";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function BoothHub() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: events } = await supabase
    .from('booth_events')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4 md:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Photo Booth Manager</h1>
              <p className="text-sm md:text-base text-muted-foreground">Select an event to manage</p>
            </div>
            <div className="w-full sm:w-auto">
              <CreateEventDialog />
            </div>
          </div>

          <div className="grid gap-3 md:gap-4">
            {events?.map((event) => (
              <Link key={event.id} href={`/booth/${event.id}`}>
                <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:bg-white/5 transition-all active:scale-[0.98]">
                  <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
                    <div>
                      <CardTitle className="text-lg md:text-xl mb-1">{event.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs md:text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {/* Only Chevron here. Delete button moved inside for security. */}
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {events?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg text-sm">
                    No events found. Create one to get started.
                </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}