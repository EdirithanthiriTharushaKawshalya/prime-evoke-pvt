// app/photos/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getPublicEvents } from "@/lib/actions";

export default async function PhotosPage() {
  const events = await getPublicEvents();

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2">Event Gallery</h1>
          <p className="text-muted-foreground">Find your photos from our recent events.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <Link key={event.id} href={`/photos/${event.slug}`} className="group block h-full">
              <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden hover:border-white/30 transition-all hover:-translate-y-1">
                {/* Cover Image */}
                <div className="h-48 bg-zinc-800/50 w-full relative">
                   {event.cover_image_url ? (
                     <Image 
                       src={event.cover_image_url} 
                       alt={event.title} 
                       fill 
                       className="object-cover transition-transform duration-500 group-hover:scale-105"
                     />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-bold text-4xl opacity-20">
                        {event.title.charAt(0)}
                     </div>
                   )}
                   {/* Gradient Overlay */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs text-primary mb-2 font-medium">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.event_date).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {event.description || "Click to view event photos and links."}
                  </p>
                  <div className="flex items-center text-sm font-medium text-white/70 group-hover:text-white">
                    View Photos <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {events.length === 0 && (
             <div className="col-span-full text-center py-20 text-muted-foreground">
                No events published yet.
             </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}