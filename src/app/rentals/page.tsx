// app/rentals/page.tsx
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  ShoppingBag, 
  RotateCcw, 
  FileCheck, 
  MapPin, 
  AlertCircle, 
  Aperture, 
  Zap, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock 
} from "lucide-react";

export default function RentalLandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col text-white selection:bg-white/20">
      <AnimatedBackground />
      <Header />

      {/* --- HERO SECTION: Clean, Pro, Grid Background --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 text-center z-10">
        {/* Subtle Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
        
        {/* Minimal Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Arrivals: Sony A7IV & Canon R5</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
          Gear You Want. <br />
          <span className="text-white/40">When You Need It.</span>
        </h1>
        
        <p className="text-gray-400 max-w-xl mx-auto text-lg mb-10 font-light leading-relaxed">
          Professional cinema & photography inventory. <br />
          Verified quality. Simple booking. Ready for your next shoot.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 transition-all font-medium text-base" asChild>
                <Link href="#stores">Start Renting <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8 rounded-full text-gray-400 hover:text-white hover:bg-white/5" asChild>
                <Link href="#process">How it Works</Link>
            </Button>
        </div>
      </section>

      {/* --- CATEGORIES: Minimal Mono Cards --- */}
      <section className="container mx-auto px-4 py-24 ">
        <div className="text-center mb-12">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Inventory</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">Browse by Category</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
                { name: "Cameras", icon: Camera, sub: "Cinema & Mirrorless" },
                { name: "Lenses", icon: Aperture, sub: "Primes & Zooms" },
                { name: "Lighting", icon: Zap, sub: "Strobes & LED" },
                { name: "Audio", icon: Mic, sub: "Mics & Recorders" },
            ].map((cat, idx) => (
                <div key={idx} className="group bg-zinc-900/50 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 cursor-default text-center">
                    <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                        <cat.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-200 group-hover:text-white">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{cat.sub}</p>
                </div>
            ))}
        </div>
      </section>

      {/* --- SELECT LOCATION: Dark, Sleek Cards --- */}
      <section id="stores" className="py-24 px-4 bg-zinc-950">
        <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Locations</p>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 text-white">Select Pickup Store</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colombo */}
                <Link href="/rentals/colombo" className="group">
                    <div className="h-full p-10 rounded-3xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 transition-all duration-300 flex flex-col items-start relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MapPin className="w-24 h-24 text-white" />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6 text-white">
                            <span className="font-bold text-lg">C</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1 tracking-wide text-white">COLOMBO</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">Head Office</p>
                        <div className="mt-auto flex items-center gap-2 text-sm font-medium text-white group-hover:translate-x-2 transition-transform">
                            Browse Inventory <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>

                {/* Ambalangoda */}
                <Link href="/rentals/ambalangoda" className="group">
                    <div className="h-full p-10 rounded-3xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 transition-all duration-300 flex flex-col items-start relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MapPin className="w-24 h-24 text-white" />
                        </div>
                         <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6 text-white">
                            <span className="font-bold text-lg">A</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1 tracking-wide text-white">AMBALANGODA</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8">Southern Branch</p>
                         <div className="mt-auto flex items-center gap-2 text-sm font-medium text-white group-hover:translate-x-2 transition-transform">
                            Browse Inventory <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
      </section>

      {/* --- PROCESS: Clean Steps --- */}
      <section id="process" className="py-24 border-t border-white/5">
        <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Workflow</p>
                 <h2 className="text-3xl font-bold mt-2">How it Works</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { step: "01", title: "Reserve", icon: FileCheck, desc: "Book online to secure dates." },
                    { step: "02", title: "Verify", icon: ShieldCheck, desc: "One-time ID check for safety." },
                    { step: "03", title: "Pick Up", icon: ShoppingBag, desc: "Grab your gear from the store." },
                    { step: "04", title: "Return", icon: RotateCcw, desc: "Bring it back by the due time." },
                ].map((item, i) => (
                    <div key={i} className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                        <div className="text-xs font-mono text-gray-600 mb-4">STEP {item.step}</div>
                        <item.icon className="w-8 h-8 text-white mb-4" />
                        <h3 className="text-lg font-bold mb-2 text-gray-200">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- REQUIREMENTS: Compact List --- */}
      <section className="py-20 ">
        <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex flex-col md:flex-row items-start gap-12">
                <div className="md:w-1/3">
                    <h2 className="text-2xl font-bold mb-2">Requirements</h2>
                    <p className="text-gray-500 text-sm">What you need to bring for your first rental.</p>
                    <Button variant="outline" className="mt-6 border-white/20 text-white hover:bg-white hover:text-black" asChild>
                        <Link href="/rentals/auth">Register Account</Link>
                    </Button>
                </div>
                <div className="md:w-2/3 grid gap-4">
                    {[
                        "Proof of Billing (Utility bill matching ID)",
                        "National Identity Card (NIC) or Driving License",
                        "Two passport size photographs",
                        "50% Advance payment for reservation"
                    ].map((req, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                            <CheckCircle2 className="h-5 w-5 text-gray-400 shrink-0" />
                            <span className="text-gray-300 text-sm">{req}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}