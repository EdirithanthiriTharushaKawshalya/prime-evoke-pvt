import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Sliders, Mic2, Mail } from "lucide-react";

export default function EvokeWavesPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground />
      
      <Header />

      <main className="flex-1 flex flex-col justify-center">
        
        {/* --- Hero Section --- */}
        <section 
          className="relative pt-28 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden"
          data-aos="fade-up"
        >
          <div className="container mx-auto text-center relative z-10">
            {/* Neutral Badge */}
            <Badge variant="outline" className="mb-6 px-4 py-1 border-white/20 bg-white/5 text-white/80 uppercase tracking-widest text-[10px]">
              Audio Production House
            </Badge>
            
            {/* Monochromatic Gradient Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              Evoke <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Waves</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Where sonic precision meets creative vision. <br className="hidden md:block" />
              Professional music production, mixing, and sound design.
            </p>
          </div>

          {/* Neutral Glow (White/Zinc) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-500/20 blur-[120px] rounded-full pointer-events-none opacity-30" />
        </section>

        {/* --- Services Grid --- */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <ServiceCard 
              title="Music Production"
              description="From initial concept to a fully realized track. We help structure, arrange, and produce your next hit."
              icon={Music}
              delay={100}
            />

            <ServiceCard 
              title="Mixing & Mastering"
              description="Polishing your sound for a professional, radio-ready finish. Depth, clarity, and punch guaranteed."
              icon={Sliders}
              delay={200}
            />

            <ServiceCard 
              title="Sound Design"
              description="Creating custom soundscapes, foley, and effects for film, games, and digital media."
              icon={Mic2}
              delay={300}
            />

          </div>
        </section>

        {/* --- Contact CTA Section --- */}
        <section 
          className="container mx-auto px-4 pb-24"
          data-aos="fade-up"
          data-aos-delay="400"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-16 text-center">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/80 pointer-events-none" />
             
             <div className="relative z-10">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Amplify Your Sound?</h2>
               <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                 Whether you have a demo or just an idea, let&apos;s talk about how we can collaborate to bring your audio vision to life.
               </p>
               
               {/* Minimalist White Button */}
               <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-black hover:bg-zinc-200 transition-colors" asChild>
                 <a href="mailto:contact@primeevoke.com" className="flex items-center gap-2">
                   <Mail className="h-4 w-4" />
                   Get in Touch
                 </a>
               </Button>
             </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

// --- Reusable Service Card Component ---
interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  delay: number;
}

function ServiceCard({ title, description, icon: Icon, delay }: ServiceCardProps) {
  return (
    <div 
      className="group p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-all duration-300 hover:-translate-y-1"
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      {/* Neutral Icon Container */}
      <div className="mb-6 inline-flex p-3 rounded-2xl bg-white/5 text-white border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
        <Icon className="h-6 w-6" />
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}