import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Plus, ChevronRight } from "lucide-react";
import { CreateEventDialog } from "@/components/booth/CreateEventDialog"; // You'll create this dialog similar to your others

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
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Photo Booth Manager</h1>
            <p className="text-zinc-400">Select an event to manage</p>
          </div>
          <CreateEventDialog />
        </div>

        <div className="grid gap-4">
          {events?.map((event) => (
            <Link key={event.id} href={`/booth/${event.id}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-6 w-6 text-zinc-500" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}