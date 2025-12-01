// app/rentals/[storeId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, ShoppingCart, Plus, Minus, ArrowLeft, 
  MapPin, SlidersHorizontal, PackageOpen, X, ImageIcon,
  ArrowRight
} from "lucide-react";
import { RentalEquipment } from "@/lib/types";
import { RentalCheckoutSheet } from "@/components/rentals/RentalCheckoutSheet";
import { cn } from "@/lib/utils";

export default function StoreRentalsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  const [equipment, setEquipment] = useState<RentalEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [id: number]: number }>({}); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchEquipment() {
      const { data } = await supabase
        .from("rental_equipment")
        .select("*")
        .eq("is_active", true)
        .eq("store_location", storeId)
        .order("category", { ascending: true });

      if (data) setEquipment(data as RentalEquipment[]);
      setLoading(false);
    }
    fetchEquipment();
  }, [supabase, storeId]);

  const formatStoreName = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

  const updateCart = (item: RentalEquipment, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[item.id] || 0;
      const newQty = Math.max(0, Math.min(item.quantity_total, currentQty + delta));
      const newCart = { ...prev };
      if (newQty === 0) delete newCart[item.id];
      else newCart[item.id] = newQty;
      return newCart;
    });
  };

  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartDailyTotal = equipment.reduce((total, item) => {
    const qty = cart[item.id] || 0;
    return total + (qty * item.daily_rate);
  }, 0);

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["All", ...Array.from(new Set(equipment.map((e) => e.category)))];

  return (
    <div className="relative min-h-screen flex flex-col ">
      <AnimatedBackground />
      <Header />
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-12 px-4 overflow-hidden">
        {/* Cinematic Gradient Backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-50" />
        
        <div className="container mx-auto relative z-10">
          <Button 
            variant="ghost" 
            size="sm"
            className="mb-6 text-muted-foreground hover:text-white pl-0 hover:pl-2 transition-all group"
            onClick={() => router.push('/rentals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            Switch Location
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 px-3 py-1 uppercase tracking-widest text-[10px]">
                  <MapPin className="h-3 w-3 mr-1" /> {formatStoreName(storeId)} Branch
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2">
                Rentals <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-gray-600">Inventory</span>
              </h1>
              <p className="text-muted-foreground max-w-lg text-lg">
                Professional gear available for immediate pickup at our {formatStoreName(storeId)} studio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- STICKY CONTROL BAR --- */}
      <div className="sticky top-16 z-40 w-full border-y border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Find cameras, lenses, lights..." 
                className="pl-10 h-10 bg-white/5 border-white/10 focus:border-primary/50 rounded-full transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs (Mobile Scrollable) */}
            <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                      activeTab === cat 
                        ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="container mx-auto px-4 py-12 flex-1 min-h-[50vh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        ) : filteredEquipment.length === 0 ? (
           <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
             <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
             <h3 className="text-lg font-medium text-white">No equipment found</h3>
             <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEquipment
              .filter((item) => activeTab === "All" || item.category === activeTab)
              .map((item) => {
                const stockStatus = item.quantity_total === 0 ? 'Out of Stock' : item.quantity_total < 3 ? 'Low Stock' : 'Available';
                const statusColor = item.quantity_total === 0 ? 'text-red-500' : item.quantity_total < 3 ? 'text-amber-500' : 'text-emerald-500';
                
                return (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "group relative flex flex-col overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/60 hover:-translate-y-1",
                      cart[item.id] && "ring-1 ring-primary border-primary/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                    )}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-video w-full bg-black/40 overflow-hidden border-b border-white/5">
                      {item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.name} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/30">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      
                      {/* Floating Badge */}
                      <div className="absolute top-3 left-3 flex gap-2">
                         <Badge className="bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/70">{item.category}</Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", statusColor)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {stockStatus}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity_total} Units
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {item.description || "Professional grade studio equipment tailored for high-end productions."}
                      </p>
                      
                      <div className="flex items-baseline gap-1 mt-auto">
                        <span className="text-xs text-muted-foreground">Rate:</span>
                        <span className="text-xl font-bold text-white">Rs. {item.daily_rate.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">/day</span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-5 pt-0">
                      {cart[item.id] ? (
                        <div className="flex items-center justify-between w-full bg-primary/10 border border-primary/20 rounded-xl p-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/20 hover:text-primary" 
                            onClick={() => updateCart(item, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-sm min-w-[20px] text-center text-primary">{cart[item.id]}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/20 hover:text-primary" 
                            onClick={() => updateCart(item, 1)} 
                            disabled={cart[item.id] >= item.quantity_total}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-white/5 border border-white/10 hover:bg-white hover:text-black hover:border-white transition-all text-white" 
                          variant="outline"
                          onClick={() => updateCart(item, 1)}
                          disabled={item.quantity_total === 0}
                        >
                          {item.quantity_total === 0 ? "Unavailable" : "Add to Request"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* --- FLOATING DOCK CART --- */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="container mx-auto max-w-2xl">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-between ring-1 ring-white/5">
              
              <div className="flex items-center gap-4 pl-2">
                <div className="relative">
                  <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black ring-2 ring-zinc-900">
                    {cartTotalItems}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Estimated Daily</span>
                  <span className="font-bold text-white text-base">Rs. {cartDailyTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                size="lg"
                className="rounded-xl px-8 font-bold bg-white text-black hover:bg-gray-200" 
                onClick={() => setIsCheckoutOpen(true)}
              >
                Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sheet */}
      <RentalCheckoutSheet 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        equipment={equipment}
        setCart={setCart}
        storeId={storeId}
      />
      
      <Footer />
    </div>
  );
}