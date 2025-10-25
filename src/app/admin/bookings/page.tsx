// app/admin/bookings/page.tsx - Full updated file
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookingCard } from "@/components/ui/BookingCard";
import { ReportDownloadButton } from "@/components/ui/ReportDownloadButton";
import { Booking, Profile, TeamMember, ServicePackage } from "@/lib/types";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

// Main Async Server Component
export default async function AdminBookingsPage() {
  // ✅ Fully Next.js 15-compatible Supabase client
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
            // Ignore errors if middleware manages session updates
          }
        },
        remove: async (name: string, options?: CookieOptions) => {
          const store = await cookies();
          try {
            store.delete({ name, ...options });
          } catch {
            // Ignore errors if middleware manages session updates
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
    return (
      <p className="text-destructive text-center mt-10">
        Error checking authentication. Please try logging in again.
      </p>
    );
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
    return (
      <p className="text-destructive text-center mt-10">
        Could not load user profile. Please contact support.
      </p>
    );
  }

  const userRole = profile.role ?? "staff";
  const userName = profile.full_name || session.user.email || "Unknown User";

  // --- Fetch Packages ---
  let packages: ServicePackage[] = [];
  const { data: packagesData, error: packagesError } = await supabase
    .from("services")
    .select("*");

  if (!packagesError && packagesData) {
    packages = packagesData as ServicePackage[];
  }

  // --- Fetch Bookings ---
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

    // Fetch financial entries for these bookings
    const bookingIds = bookings.map(b => b.id);
    if (bookingIds.length > 0) {
      const { data: financialEntries, error: financialError } = await supabase
        .from('financial_entries')
        .select('*')
        .in('booking_id', bookingIds);

      if (!financialError && financialEntries) {
        // Map financial entries to bookings
        bookings = bookings.map(booking => ({
          ...booking,
          financial_entry: financialEntries.find(fe => fe.booking_id === booking.id) || null
        }));
      }
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

  const sortedMonths = Object.keys(groupedBookings).sort((a, b) => {
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

  // --- Render ---
  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Client Bookings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all client inquiries with unique tracking IDs
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
            Error loading bookings: {fetchError}
          </p>
        )}
        {!fetchError && bookings.length === 0 && <p>No bookings found.</p>}

        {sortedMonths.map((monthYear) => (
          <div key={monthYear} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
              {monthYear}
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
      </div>
      <Footer />
    </div>
  );
}