// app/admin/photos/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowLeft } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CreatePublicEventDialog } from "@/components/photos/CreatePublicEventDialog";
import { PhotoEventActions } from "@/components/photos/PhotoEventActions";
import { getPublicEvents } from "@/lib/actions";

export default async function AdminPhotosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // 1. Secure this page (Admin Only)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'management') redirect("/");

  // 2. Fetch Events
  const events = await getPublicEvents();

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-10 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Gallery Management</h1>
              <p className="text-muted-foreground">Manage public event photos and links</p>
            </div>
          </div>
          {/* Add Event Button (Only visible here in Admin) */}
          <CreatePublicEventDialog />
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <div key={event.id} className="relative group">
              {/* Card mimics the public view but isn't a link (unless you want it to be) */}
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden">
                <div className="h-48 bg-zinc-800/50 w-full relative">
                   {event.cover_image_url ? (
                     <Image 
                       src={event.cover_image_url} 
                       alt={event.title} 
                       fill 
                       className="object-cover"
                     />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-bold text-4xl opacity-20">
                        {event.title.charAt(0)}
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/20" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs text-primary mb-2 font-medium">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description || "No description."}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-muted-foreground">
                    <span>/{event.slug}</span>
                    <Link href={`/photos/${event.slug}`} className="hover:text-white underline">
                        View Live Page
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Edit/Delete Actions (The "Three Dots" Menu) */}
              <PhotoEventActions event={event} />
            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                No public events found. Create one to get started.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}