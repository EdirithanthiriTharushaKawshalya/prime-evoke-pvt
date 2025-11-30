// app/rentals/page.tsx
import Link from "next/link";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, ShoppingBag, RotateCcw, FileCheck, MapPin, AlertCircle } from "lucide-react";

export default function RentalLandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Gear You Want, <span className="text-primary">When You Need It.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
          Rent professional photography and cinematography equipment from the industry experts at Prime Evoke.
        </p>
      </section>

      {/* --- HOW IT WORKS (Based on Screenshot 1) --- */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-12 text-center">How It Works?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-card/30 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-sm">
            <div className="text-6xl font-bold text-white/10 mb-4">1</div>
            <div className="flex justify-center mb-4">
              <FileCheck className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Rent</h3>
            <p className="text-sm text-muted-foreground">
              Browse our selection, choose your period, and reserve your gear online.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-card/30 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-sm">
            <div className="text-6xl font-bold text-white/10 mb-4">2</div>
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pick Up</h3>
            <p className="text-sm text-muted-foreground">
              Visit your selected store location (Colombo or Ambalangoda) to pick up your order.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-card/30 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-sm">
            <div className="text-6xl font-bold text-white/10 mb-4">3</div>
            <div className="flex justify-center mb-4">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Shoot</h3>
            <p className="text-sm text-muted-foreground">
              Create your masterpiece with high-quality professional equipment.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-card/30 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-sm">
            <div className="text-6xl font-bold text-white/10 mb-4">4</div>
            <div className="flex justify-center mb-4">
              <RotateCcw className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Return</h3>
            <p className="text-sm text-muted-foreground">
              Return the gear by the due date to avoid late fees and keep creating.
            </p>
          </div>
        </div>
      </section>

      {/* --- RENT BY STORE (Based on Screenshot 2) --- */}
      <section className="container mx-auto px-4 py-16 bg-white/5 rounded-3xl my-10">
        <h2 className="text-3xl font-bold mb-12 text-center">Rent By Store</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Colombo Store */}
          <Link href="/rentals/colombo" className="group">
            <Card className="h-full border-white/10 bg-gradient-to-br from-blue-900/40 to-black hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="text-center pt-10">
                <MapPin className="h-12 w-12 mx-auto text-blue-400 mb-4" />
                <CardTitle className="text-3xl uppercase tracking-widest">Colombo</CardTitle>
                <CardDescription>Prime Evoke Head Office</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-10">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Browse Colombo Inventory</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Ambalangoda Store */}
          <Link href="/rentals/ambalangoda" className="group">
            <Card className="h-full border-white/10 bg-gradient-to-br from-red-900/40 to-black hover:border-red-500/50 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="text-center pt-10">
                <MapPin className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <CardTitle className="text-3xl uppercase tracking-widest">Ambalangoda</CardTitle>
                <CardDescription>Prime Evoke Branch</CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-10">
                <Button className="mt-4 bg-red-600 hover:bg-red-700">Browse Ambalangoda Inventory</Button>
              </CardContent>
            </Card>
          </Link>

        </div>
      </section>

      {/* --- IMPORTANT THINGS TO CONSIDER (Based on Screenshot 3) --- */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold mb-8">Important Things to Consider</h2>
        <div className="space-y-6 text-muted-foreground bg-card/20 p-8 rounded-xl border border-white/10">
          <p>To register with us before renting, please submit the following upon pickup:</p>
          
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>Proof of Billing (Electricity/Water bill matching your ID address)</span>
            </li>
            <li className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>Copy of your National Identity Card (NIC)</span>
            </li>
            <li className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>Two passport size photos</span>
            </li>
          </ul>

          <div className="h-px bg-white/10 my-4" />

          <ul className="space-y-3 text-sm">
            <li>• Your rental begins when you pick up the equipment.</li>
            <li>• Your rental must be returned to its pick up location before the cut-off-time.</li>
            <li>• For your security, get a receipt from whoever you are dropping your gear off with for return.</li>
            <li>• We typically request a 50% deposit to process your order, or full payment upon pickup depending on the equipment value.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}