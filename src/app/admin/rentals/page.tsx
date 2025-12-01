// app/admin/rentals/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Camera, Calendar, CheckCircle, XCircle, Clock, ShieldAlert, MapPin, Image as ImageIcon } from "lucide-react"; 
import Link from "next/link";
import Image from "next/image"; // <--- 1. Import Image
import { RentalEquipment, RentalBooking, Profile } from "@/lib/types";
import { AddEquipmentDialog } from "@/components/ui/AddEquipmentDialog";
import { Badge } from "@/components/ui/badge";
import VerificationDialog from "@/components/admin/rentals/VerificationDialog";
import { RentalBookingActions } from "@/components/admin/rentals/BookingActions";
import { InventoryActions } from "@/components/admin/rentals/InventoryActions";

export default async function RentalsAdminPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  const userRole = (profileData as Profile)?.role || 'staff';
  const isManagement = userRole === 'management';

  // Fetch Inventory
  const { data: equipmentData } = await supabase
    .from("rental_equipment")
    .select("*")
    .order("category", { ascending: true });
  
  const inventory = (equipmentData as RentalEquipment[]) || [];

  // Fetch Bookings (with items)
  const { data: bookingsData } = await supabase
    .from("rental_bookings")
    .select("*, items:rental_order_items(*)")
    .order("created_at", { ascending: false });

  const bookings = (bookingsData as RentalBooking[]) || [];

  // Helper to format store name
  const formatStoreId = (id: string | undefined) => {
    if (!id) return "Unknown";
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-6 px-4 md:py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Rentals Management</h1>
              <p className="text-sm text-muted-foreground">Manage bookings and fleet inventory</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 rounded-full">
            <TabsTrigger value="bookings" className="rounded-full">Rental Bookings</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-full">Fleet Inventory</TabsTrigger>
          </TabsList>

          {/* --- BOOKINGS TAB --- */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No rental bookings found.
              </div>
            )}
            
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{booking.client_name}</CardTitle>
                        
                        {/* STORE LOCATION BADGE */}
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                           <MapPin className="h-3 w-3" />
                           {formatStoreId(booking.store_id)}
                        </Badge>

                        <Badge variant={
                          booking.status === 'Confirmed' ? 'default' : 
                          booking.status === 'Active' ? 'secondary' :
                          booking.status === 'Completed' ? 'outline' : 
                          'destructive'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{booking.booking_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">Rs. {booking.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                        <p className="text-muted-foreground">Contact</p>
                        <p>{booking.client_email}</p>
                        <p>{booking.client_phone}</p>
                    </div>
                    <div className="text-right md:text-left">
                        <p className="text-muted-foreground">Rental Period</p>
                        <p>{new Date(booking.start_date).toLocaleDateString()} — {new Date(booking.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded p-3 text-sm space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Items Rented</p>
                    {booking.items?.map((item) => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.quantity}x {item.equipment_name}</span>
                            <span className="text-muted-foreground">{item.days_rented} Days</span>
                        </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
                      {/* Left Side: Actions */}
                      {isManagement && <RentalBookingActions booking={booking} />}

                      {/* Right Side: Verification */}
                      <div className="flex gap-2">
                          {isManagement && booking.verification_status === 'pending' && (
                              <VerificationDialog 
                                bookingId={booking.id}
                                clientName={booking.client_name}
                              />
                          )}

                          {booking.verification_status === 'verified' && (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" /> Verified Client
                              </Badge>
                          )}
                      </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* --- INVENTORY TAB --- */}
          <TabsContent value="inventory" className="space-y-6">
            
            {isManagement && (
                <div className="flex justify-end">
                    <AddEquipmentDialog />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item) => (
                    <Card key={item.id} className="border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden">
                        
                        {/* 2. INSERT IMAGE HERE */}
                        <div className="relative w-full h-32 bg-black/20 border-b border-white/5">
                            {item.image_url ? (
                                <Image 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    fill 
                                    className="object-cover transition-transform hover:scale-105"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 opacity-20" />
                                </div>
                            )}
                        </div>

                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                                        <Badge variant="secondary" className="text-[10px] opacity-70">
                                            {formatStoreId(item.store_location)}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                                </div>
                                {isManagement && <InventoryActions item={item} />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                {item.description || "No description available."}
                            </p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground">Quantity</p>
                                    <p className="text-xl font-bold">{item.quantity_total}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Daily Rate</p>
                                    <p className="text-lg font-semibold text-primary">Rs. {item.daily_rate.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {inventory.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                        No equipment added yet.
                    </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}