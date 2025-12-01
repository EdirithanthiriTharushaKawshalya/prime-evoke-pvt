// app/rentals/[storeId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation"; // Import Hooks
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingCart, Plus, Minus, ArrowLeft, Camera } from "lucide-react";
import { RentalEquipment } from "@/lib/types";
import { RentalCheckoutSheet } from "@/components/rentals/RentalCheckoutSheet";
import Image from "next/image"; // Add this

export default function StoreRentalsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string; // 'colombo' or 'ambalangoda'

  const [equipment, setEquipment] = useState<RentalEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [id: number]: number }>({}); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchEquipment() {
      // Fetch equipment filtered by the specific store location
      const { data, error } = await supabase
        .from("rental_equipment")
        .select("*")
        .eq("is_active", true)
        .eq("store_location", storeId) // <--- THIS IS THE KEY FILTER
        .order("category", { ascending: true });

      if (data) setEquipment(data as RentalEquipment[]);
      setLoading(false);
    }
    fetchEquipment();
  }, [supabase, storeId]);

  // --- Formatting Helpers ---
  const formatStoreName = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

  // --- Cart Logic (Same as before) ---
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

  // --- Filter Logic ---
  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["All", ...Array.from(new Set(equipment.map((e) => e.category)))];

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      
      {/* Store Header */}
      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0 hover:pl-2 transition-all"
            onClick={() => router.push('/rentals')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store Selection
          </Button>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            Rentals: <span className="text-primary">{formatStoreName(storeId)}</span>
          </h1>
          <p className="text-muted-foreground">
            Browse available equipment at our {formatStoreName(storeId)} branch.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <div className="container mx-auto px-4 mb-8 sticky top-20 z-30">
        <div className="bg-background/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search cameras, lenses, lights..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-32 flex-1">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Checking inventory at {formatStoreName(storeId)}...</div>
        ) : filteredEquipment.length === 0 ? (
           <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-xl">
             No equipment currently listed for this location.
           </div>
        ) : (
          <Tabs defaultValue="All" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-center mb-8">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="rounded-full border border-white/10 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat} value={cat}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEquipment
                    .filter((item) => cat === "All" || item.category === cat)
                    .map((item) => (
                      <Card key={item.id} className={`flex flex-col border-white/10 bg-card/40 backdrop-blur-sm transition-all duration-300 overflow-hidden ${cart[item.id] ? 'border-primary/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : ''}`}>
                        
                        {/* --- NEW: Image Section --- */}
                        <div className="relative w-full h-48 bg-black/20">
                          {item.image_url ? (
                            <Image 
                              src={item.image_url} 
                              alt={item.name} 
                              fill 
                              className="object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <Camera className="h-12 w-12 opacity-20" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider backdrop-blur-md bg-black/50 text-white border-white/10">
                                  {item.category}
                              </Badge>
                          </div>
                        </div>

                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-xs text-muted-foreground">{item.quantity_total} in stock</span>
                          </div>
                          <CardTitle className="text-lg mt-1 line-clamp-1">{item.name}</CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2 flex-1">
                          <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">
                            {item.description || "Professional grade equipment."}
                          </p>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-primary">Rs. {item.daily_rate.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">/ day</span>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="p-4 pt-0">
                          {cart[item.id] ? (
                            <div className="flex items-center justify-between w-full bg-primary/10 rounded-lg p-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20" onClick={() => updateCart(item, -1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-sm">{cart[item.id]}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20" onClick={() => updateCart(item, 1)} disabled={cart[item.id] >= item.quantity_total}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button className="w-full" variant="outline" onClick={() => updateCart(item, 1)}>
                              Add to Request
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-2xl flex items-center justify-between backdrop-blur-xl border border-white/20">
              <div className="flex items-center gap-4 px-2">
                <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm md:text-base">{cartTotalItems} Items Selected</p>
                  <p className="text-xs opacity-90">Est. Daily: Rs. {cartDailyTotal.toLocaleString()}</p>
                </div>
              </div>
              <Button variant="secondary" className="rounded-full px-6 font-bold" onClick={() => setIsCheckoutOpen(true)}>
                Checkout ({formatStoreName(storeId)})
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