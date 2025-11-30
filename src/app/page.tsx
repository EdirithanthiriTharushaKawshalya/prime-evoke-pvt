import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Camera, 
  Aperture, 
  Zap, 
  AudioWaveform, 
  ArrowRight, 
  Users 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      <Header />

      <main className="flex-1 flex flex-col justify-center">
        {/* --- Hero Section --- */}
        <section 
          className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden"
          data-aos="fade-up"
        >
          <div className="container mx-auto text-center relative z-10">
            <Badge variant="outline" className="mb-6 px-4 py-1 border-white/20 bg-white/5 text-white/80 uppercase tracking-widest text-[10px]">
              Creative Production House
            </Badge>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
              Prime Evoke
            </h1>
            
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Capturing Moments. Crafting Sound. <br className="hidden md:block" />
              The professional hub for visual storytelling and sonic excellence.
            </p>
          </div>

          {/* Decorative Gradient Glow behind Hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
        </section>

        {/* --- The Ecosystem Grid (Bento Style) --- */}
        <section className="container mx-auto px-4 pb-24 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            
            {/* 1. Evoke Gallery */}
            <BrandCard 
              href="/evoke-gallery"
              title="Evoke Gallery"
              subtitle="Wedding & Portrait Photography"
              description="Timeless captures of life's most beautiful moments. We specialize in weddings and artistic portraits."
              icon={Aperture}
              delay={100}
              gradient="from-pink-500/20 to-purple-500/20"
            />

            {/* 2. Studio Zine */}
            <BrandCard 
              href="/studio-zine"
              title="Studio Zine"
              subtitle="Brand & Commercial Visuals"
              description="High-impact photography for brands, events, and fashion. Modern aesthetics for the creative professional."
              icon={Zap}
              delay={200}
              gradient="from-yellow-500/20 to-orange-500/20"
            />

            {/* 3. Evoke Waves */}
            <BrandCard 
              href="/evoke-waves"
              title="Evoke Waves"
              subtitle="Audio Production House"
              description="Full-spectrum audio engineering. Music production, mixing, mastering, and sound design."
              icon={AudioWaveform}
              delay={300}
              gradient="from-cyan-500/20 to-blue-500/20"
            />

            {/* 4. Evoke Rentals */}
            <BrandCard 
              href="/rentals"
              title="Evoke Rentals"
              subtitle="Equipment Hire"
              description="Access our professional arsenal. Cameras, lenses, and lighting available for your own productions."
              icon={Camera}
              delay={400}
              gradient="from-emerald-500/20 to-teal-500/20"
            />

          </div>
        </section>

        {/* --- Team Section (Minimalist Strip) --- */}
        <section 
          className="border-t border-white/5 bg-white/[0.02]"
          data-aos="fade-up"
        >
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-full">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Meet The Collective</h2>
                </div>
                <p className="text-muted-foreground max-w-md">
                  Discover the passionate photographers, producers, and creatives behind the Prime Evoke vision.
                </p>
              </div>
              
              <Button size="lg" className="rounded-full px-8 h-12 text-base group" asChild>
                <Link href="/team">
                  View Profiles 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// --- Reusable Component for the Grid ---
interface BrandCardProps {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  delay: number;
  gradient: string;
}

function BrandCard({ href, title, subtitle, description, icon: Icon, delay, gradient }: BrandCardProps) {
  return (
    <Link 
      href={href}
      className="group relative block h-full"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm" />
      
      <div className="relative h-full flex flex-col justify-between p-8 md:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-black/60">
        
        {/* Subtle Gradient Blob on Hover */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradient} blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground -rotate-45 group-hover:rotate-0 group-hover:text-white transition-all duration-300" />
          </div>

          <h3 className="text-3xl font-bold mb-2 text-white group-hover:tracking-wide transition-all duration-300">
            {title}
          </h3>
          <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-4">
            {subtitle}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <span className="text-sm font-medium text-white/40 group-hover:text-white transition-colors">
            Explore {title} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}