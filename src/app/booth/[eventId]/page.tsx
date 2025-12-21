import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, Users, Plus } from "lucide-react";
import { CreateItemDialog } from "@/components/booth/CreateItemDialog";

export default async function EventDashboard({ params }: { params: { eventId: string } }) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Fetch Event Info
  const { data: event } = await supabase.from('booth_events').select('*').eq('id', eventId).single();
  // Fetch Items
  const { data: items } = await supabase.from('booth_items').select('*').eq('event_id', eventId).order('id');

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/booth">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{event?.name}</h1>
            <p className="text-zinc-400">Event Dashboard</p>
          </div>
        </div>

        {/* Quick Access "Other Prints" */}
        <Link href={`/booth/${eventId}/other`}>
          <Card className="bg-blue-900/20 border-blue-500/30 mb-8 hover:bg-blue-900/30 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-100">Other / Individual Prints</h2>
                <p className="text-blue-300/70">Manage ad-hoc prints not related to specific items.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Items Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Event Items</h2>
          <CreateItemDialog eventId={parseInt(eventId)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items?.map((item) => (
            <Link key={item.id} href={`/booth/${eventId}/item/${item.id}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.description && <p className="text-sm text-zinc-400">{item.description}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-zinc-500">
                    <Users className="h-4 w-4 mr-2" /> Open Item
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}