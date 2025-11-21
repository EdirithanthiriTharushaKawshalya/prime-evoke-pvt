// app/admin/bookings/page.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/ui/BookingCard";
import { ReportDownloadButton } from "@/components/ui/ReportDownloadButton";
import { MySalaryDownloadButton } from "@/components/ui/MySalaryDownloadButton";
import {
  Booking,
  Profile,
  TeamMember,
  ServicePackage,
  ProductOrder,
} from "@/lib/types";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductOrderCard } from "@/components/ui/ProductOrderCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const groupBookingsByMonth = (bookings: Booking[]) => {
  return bookings.reduce((acc, booking) => {
    const groupDate = booking.event_date
      ? new Date(booking.event_date)
      : new Date(booking.created_at);
    const monthYear = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(groupDate);
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);
};

const groupProductOrdersByMonth = (orders: ProductOrder[]) => {
  return orders.reduce((acc, order) => {
    const groupDate = new Date(order.created_at);
    const monthYear = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(groupDate);
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(order);
    return acc;
  }, {} as Record<string, ProductOrder[]>);
};

export default async function AdminBookingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const store = await cookies();
          return store.get(name)?.value;
        },
        set: async (name: string, value: string, options?: CookieOptions) => {
          const store = await cookies();
          try {
            store.set({ name, value, ...options });
          } catch {}
        },
        remove: async (name: string, options?: CookieOptions) => {
          const store = await cookies();
          try {
            store.delete({ name, ...options });
          } catch {}
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) console.error("Session fetch error:", sessionError);
  if (!session) redirect("/login");

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  const profile = profileData as Profile | null;
  if (profileError || !profile) console.error("Error fetching profile:", profileError);

  const userRole = profile?.role ?? "staff";
  // Removed userName as it is no longer used here

  let packages: ServicePackage[] = [];
  const { data: packagesData } = await supabase.from("services").select("*");
  if (packagesData) packages = packagesData as ServicePackage[];

  let bookings: Booking[] = [];
  let fetchError: string | null = null;
  const { data: bookingData, error: bookingError } = await supabase
    .from("client_bookings")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false });

  if (bookingError) {
    fetchError = bookingError.message;
  } else if (bookingData) {
    bookings = bookingData as Booking[];
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length > 0) {
      const { data: financialEntries, error: financialError } = await supabase
        .from("financial_entries")
        .select("*")
        .in("booking_id", bookingIds);
      const { data: photographerDetails, error: photographerError } = await supabase
        .from("photographer_financial_details")
        .select("*")
        .in("booking_id", bookingIds);

      bookings = bookings.map((booking) => {
        const financialEntry = financialError ? null : financialEntries?.find((fe) => fe.booking_id === booking.id);
        const photographerDetailsForBooking = photographerError ? [] : photographerDetails?.filter((pd) => pd.booking_id === booking.id);
        return {
          ...booking,
          financial_entry: financialEntry ? { ...financialEntry, photographer_details: photographerDetailsForBooking } : null,
        };
      }) as Booking[];
    }
  }

  let productOrders: ProductOrder[] = [];
  const { data: productOrderData, error: productOrderError } = await supabase
    .from("product_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (productOrderError) {
    fetchError = (fetchError || "") + " " + productOrderError.message;
  } else if (productOrderData) {
    productOrders = productOrderData as ProductOrder[];
    const orderIds = productOrders.map((o) => o.id);
    if (orderIds.length > 0) {
      const { data: poFinancialEntries, error: poFinancialError } = await supabase
        .from("product_order_financial_entries")
        .select("*")
        .in("order_id", orderIds);
      const { data: poPhotographerDetails, error: poPhotographerError } = await supabase
        .from("product_order_photographer_commission")
        .select("*")
        .in("order_id", orderIds);

      productOrders = productOrders.map((order) => {
        const financialEntry = poFinancialError ? null : poFinancialEntries?.find((fe) => fe.order_id === order.id);
        const photographerDetailsForOrder = poPhotographerError ? [] : poPhotographerDetails?.filter((pd) => pd.order_id === order.id);
        return {
          ...order,
          financial_entry: financialEntry ? { ...financialEntry, photographer_details: photographerDetailsForOrder } : null,
        };
      }) as ProductOrder[];
    }
  }

  let assignableMembers: TeamMember[] = [];
  const { data: membersData, error: membersError } = await supabase.from("team_members").select("id, name").order("name");
  if (membersData) assignableMembers = membersData as TeamMember[];
  const availableStaff = assignableMembers.filter((m) => m.name).map((m) => ({ id: String(m.id), full_name: m.name }));

  const groupedBookings = groupBookingsByMonth(bookings);
  const sortedBookingMonths = Object.keys(groupedBookings).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    const now = new Date();
    const isAFuture = dateA.getFullYear() > now.getFullYear() || (dateA.getFullYear() === now.getFullYear() && dateA.getMonth() >= now.getMonth());
    const isBFuture = dateB.getFullYear() > now.getFullYear() || (dateB.getFullYear() === now.getFullYear() && dateB.getMonth() >= now.getMonth());
    if (isAFuture && !isBFuture) return -1;
    if (!isAFuture && isBFuture) return 1;
    return dateB.getTime() - dateA.getTime();
  });

  const groupedProductOrders = groupProductOrdersByMonth(productOrders);
  const sortedOrderMonths = Object.keys(groupedProductOrders).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div>
      <AnimatedBackground />
      <div className="relative min-h-screen flex flex-col" data-aos="fade-up">
        <Header />
        <div className="container mx-auto py-6 px-4 md:py-10">
          
          {/* --- Header Section --- */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Bookings & Orders</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage client bookings and product orders
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <ReportDownloadButton userRole={userRole} />
              <MySalaryDownloadButton />
            </div>
          </div>

          {/* REMOVED: "Viewing as" paragraph */}

          {fetchError && (
            <p className="text-destructive text-sm mb-4">Error loading data: {fetchError}</p>
          )}

          {/* --- Tabbed Interface --- */}
          <Tabs defaultValue="bookings" className="w-full">
            {/* ... (tabs content remains the same) ... */}
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 md:mb-8 rounded-full h-12">
              <TabsTrigger value="bookings" className="rounded-full text-xs md:text-sm">
                Client Bookings
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-full text-xs md:text-sm">
                Product Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-8">
              {!fetchError && bookings.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="text-muted-foreground text-lg">No bookings found.</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    When clients submit inquiries, they will appear here.
                  </p>
                </div>
              )}

              {sortedBookingMonths.map((monthYear) => (
                <div key={monthYear} className="mb-8">
                  <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 border-b pb-2 flex justify-between items-baseline">
                    <span>{monthYear}</span>
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({groupedBookings[monthYear].length} bookings)
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {groupedBookings[monthYear].map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        userRole={userRole}
                        availableStaff={availableStaff}
                        packages={packages}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="products" className="space-y-8">
              {!fetchError && productOrders.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="text-muted-foreground text-lg">No product orders found.</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    When clients purchase products, they will appear here.
                  </p>
                </div>
              )}

              {sortedOrderMonths.map((monthYear) => (
                <div key={monthYear} className="mb-8">
                  <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 border-b pb-2 flex justify-between items-baseline">
                    <span>{monthYear}</span>
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({groupedProductOrders[monthYear].length} orders)
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {groupedProductOrders[monthYear].map((order) => (
                      <ProductOrderCard
                        key={order.id}
                        order={order}
                        userRole={userRole}
                        availableStaff={availableStaff}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
        <Footer />
      </div>
    </div>
  );
}