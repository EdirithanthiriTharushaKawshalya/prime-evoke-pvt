// app/admin/bookings/page.tsx - Full updated file
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/ui/BookingCard";
import { ReportDownloadButton } from "@/components/ui/ReportDownloadButton";
import { 
  Booking, 
  Profile, 
  TeamMember, 
  ServicePackage, 
  ProductOrder 
} from "@/lib/types";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductOrderCard } from "@/components/ui/ProductOrderCard";

// Helper function to group bookings by month
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

// Helper function to group product orders by month
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

// Main Async Server Component
export default async function AdminBookingsPage() {
  const cookieStore = cookies();
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
          } catch {
            // Ignore errors
          }
        },
        remove: async (name: string, options?: CookieOptions) => {
          const store = await cookies();
          try {
            store.delete({ name, ...options });
          } catch {
            // Ignore errors
          }
        },
      },
    }
  );

  // --- Fetch Session & Profile ---
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session fetch error:", sessionError);
  }
  if (!session) {
    redirect("/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  const profile = profileData as Profile | null;

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
  }

  const userRole = profile?.role ?? "staff";
  const userName = profile?.full_name || session.user.email || "Unknown User";

  // --- Fetch Packages ---
  let packages: ServicePackage[] = [];
  const { data: packagesData } = await supabase
    .from("services")
    .select("*");
  if (packagesData) {
    packages = packagesData as ServicePackage[];
  }

  // --- Fetch Bookings (Sequential Method) ---
  let bookings: Booking[] = [];
  let fetchError: string | null = null;

  const { data: bookingData, error: bookingError } = await supabase
    .from("client_bookings")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false });

  if (bookingError) {
    fetchError = bookingError.message;
    console.error("Error fetching bookings:", bookingError);
  } else if (bookingData) {
    bookings = bookingData as Booking[];

    // Now, fetch financial entries for these bookings
    const bookingIds = bookings.map(b => b.id);
    if (bookingIds.length > 0) {
      const { data: financialEntries, error: financialError } = await supabase
        .from('financial_entries')
        .select('*')
        .in('booking_id', bookingIds);

      // And fetch photographer details
      const { data: photographerDetails, error: photographerError } = await supabase
        .from('photographer_financial_details')
        .select('*')
        .in('booking_id', bookingIds);

      // Now, map them together
      bookings = bookings.map(booking => {
        const financialEntry = financialError ? null : financialEntries?.find(fe => fe.booking_id === booking.id);
        const photographerDetailsForBooking = photographerError ? [] : photographerDetails?.filter(pd => pd.booking_id === booking.id);
        
        return {
          ...booking,
          financial_entry: financialEntry ? {
            ...financialEntry,
            photographer_details: photographerDetailsForBooking
          } : null
        };
      }) as Booking[];
    }
  }
  
  // --- Fetch Product Orders (Sequential Method) ---
  let productOrders: ProductOrder[] = [];
  const { data: productOrderData, error: productOrderError } = await supabase
    .from("product_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (productOrderError) {
    fetchError = (fetchError || "") + " " + productOrderError.message;
    console.error("Error fetching product orders:", productOrderError);
  } else if (productOrderData) {
    productOrders = productOrderData as ProductOrder[];

    // Now, fetch financial entries for these orders
    const orderIds = productOrders.map(o => o.id);
    if (orderIds.length > 0) {
      const { data: poFinancialEntries, error: poFinancialError } = await supabase
        .from('product_order_financial_entries')
        .select('*')
        .in('order_id', orderIds);

      // And fetch photographer commission details
      const { data: poPhotographerDetails, error: poPhotographerError } = await supabase
        .from('product_order_photographer_commission')
        .select('*')
        .in('order_id', orderIds);
      
      // Now, map them together
      productOrders = productOrders.map(order => {
        const financialEntry = poFinancialError ? null : poFinancialEntries?.find(fe => fe.order_id === order.id);
        const photographerDetailsForOrder = poPhotographerError ? [] : poPhotographerDetails?.filter(pd => pd.order_id === order.id);

        return {
          ...order,
          financial_entry: financialEntry ? {
            ...financialEntry,
            photographer_details: photographerDetailsForOrder
          } : null
        };
      }) as ProductOrder[];
    }
  }

  // --- Fetch Available Staff ---
  let assignableMembers: TeamMember[] = [];
  const { data: membersData, error: membersError } = await supabase
    .from("team_members")
    .select("id, name")
    .order("name");

  if (membersError) {
    console.error("Error fetching team members list:", membersError);
  } else if (membersData) {
    assignableMembers = membersData as TeamMember[];
  }

  const availableStaff = assignableMembers.filter((m) => m.name).map(m => ({ 
    id: String(m.id), 
    full_name: m.name 
  }));

  // --- Grouping and Sorting ---
  const groupedBookings = groupBookingsByMonth(bookings);
  const now = new Date();

  const sortedBookingMonths = Object.keys(groupedBookings).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    const isAFuture =
      dateA.getFullYear() > now.getFullYear() ||
      (dateA.getFullYear() === now.getFullYear() &&
        dateA.getMonth() >= now.getMonth());
    const isBFuture =
      dateB.getFullYear() > now.getFullYear() ||
      (dateB.getFullYear() === now.getFullYear() &&
        dateB.getMonth() >= now.getMonth());
    if (isAFuture && !isBFuture) return -1;
    if (!isAFuture && isBFuture) return 1;
    return dateB.getTime() - dateA.getTime();
  });
  
  const groupedProductOrders = groupProductOrdersByMonth(productOrders);
  const sortedOrderMonths = Object.keys(groupedProductOrders).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime(); // Simple descending sort
  });

  // --- Render ---
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client bookings and product orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ReportDownloadButton userRole={userRole} />
            <LogoutButton />
          </div>
        </div>

        <p className="mb-8 text-muted-foreground">
          Viewing as: {userRole} ({userName})
        </p>

        {fetchError && (
          <p className="text-destructive">
            Error loading data: {fetchError}
          </p>
        )}

        {/* --- Tabbed Interface --- */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 rounded-full">
            <TabsTrigger value="bookings" className="rounded-full">Client Bookings</TabsTrigger>
            <TabsTrigger value="products" className="rounded-full">Product Orders</TabsTrigger>
          </TabsList>

          {/* --- Bookings Tab --- */}
          <TabsContent value="bookings">
            {!fetchError && bookings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">No bookings found.</div>
                <p className="text-sm text-muted-foreground mt-2">
                  When clients submit inquiries, they will appear here.
                </p>
              </div>
            )}

            {sortedBookingMonths.map((monthYear) => (
              <div key={monthYear} className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
                  {monthYear}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({groupedBookings[monthYear].length} bookings)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* --- Product Orders Tab --- */}
          <TabsContent value="products">
            {!fetchError && productOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">No product orders found.</div>
                <p className="text-sm text-muted-foreground mt-2">
                  When clients purchase products, they will appear here.
                </p>
              </div>
            )}

            {sortedOrderMonths.map((monthYear) => (
              <div key={monthYear} className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
                  {monthYear}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({groupedProductOrders[monthYear].length} orders)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProductOrders[monthYear].map((order) => (
                    <ProductOrderCard
                      key={order.id}
                      order={order}
                      userRole={userRole}
                      availableStaff={availableStaff} // <-- Correctly passing staff
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
  );
}