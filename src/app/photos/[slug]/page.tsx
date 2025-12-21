// app/photos/[slug]/page.tsx
import { getPublicEventBySlug } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Calendar, ArrowLeft, HardDrive, Facebook, Globe, Sparkles } from "lucide-react";

export default async function EventDetailsPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) return notFound();

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 container mx-auto py-12 px-4 flex flex-col items-center">
        
        <Link href="/photos" className="self-start mb-8 text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Gallery
        </Link>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground mb-4">
            <Calendar className="h-3 w-3" />
            {new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{event.title}</h1>
          <p className="text-lg text-muted-foreground">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {event.drive_link && (
            <a href={event.drive_link} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="bg-[#1DA463]/10 border-[#1DA463]/20 hover:bg-[#1DA463]/20 transition-all cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#1DA463] flex items-center justify-center shadow-lg shadow-[#1DA463]/20">
                    <HardDrive className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Google Drive</h3>
                    <p className="text-sm text-[#1DA463]">Download High-Res Photos</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          )}

          {event.facebook_album_link && (
            <a href={event.facebook_album_link} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="bg-[#1877F2]/10 border-[#1877F2]/20 hover:bg-[#1877F2]/20 transition-all cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#1877F2] flex items-center justify-center shadow-lg shadow-[#1877F2]/20">
                    <Facebook className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Facebook Album</h3>
                    <p className="text-sm text-[#1877F2]">View & Share on Socials</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          )}
        </div>

        {/* --- IMPROVED SECTION: Official Website Card --- */}
        <div className="mt-16 w-full max-w-2xl">
           <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-center sm:text-left">
                   <div className="flex items-center justify-center sm:justify-start gap-2 text-white font-semibold text-lg mb-1">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Prime Evoke Official</span>
                   </div>
                   <p className="text-sm text-muted-foreground">
                      Explore our full portfolio, services, and production house capabilities.
                   </p>
                </div>
                
                <Link href="/">
                    <Button variant="default" className="gap-2 bg-white text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5">
                        <Globe className="h-4 w-4" /> Visit Website
                    </Button>
                </Link>
              </CardContent>
           </Card>
        </div>

      </main>

      <Footer />
    </div>
  );
}