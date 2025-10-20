import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AssignPhotographers } from "@/components/ui/AssignPhotographers";
import { Booking, Profile, TeamMember } from "@/lib/types";

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
          } catch (err) {
            // Ignore errors if middleware manages session updates
          }
        },
        remove: async (name: string, options?: CookieOptions) => {
          const store = await cookies();
          try {
            store.delete({ name, ...options });
          } catch (err) {
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
  }

  // --- Fetch Available staff (MODIFIED) ---
  let assignableMembers: TeamMember[] = [];

  const { data: membersData, error: membersError } = await supabase
    .from("team_members") // Table name
    .select("id, name") // Fetch ID and name
    .order("name"); // Sort alphabetically

  if (membersError) {
    console.error("Error fetching team members list:", membersError);
  } else if (membersData) {
    assignableMembers = membersData as TeamMember[];
  }

  // Filter valid staff
  const availableStaff = assignableMembers.filter((m) => m.name);

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
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Client Bookings</h1>
      <p className="mb-4 text-muted-foreground">
        Viewing as: {userRole} ({userName})
      </p>

      {fetchError && (
        <p className="text-destructive">Error loading bookings: {fetchError}</p>
      )}
      {!fetchError && bookings.length === 0 && <p>No bookings found.</p>}

      {sortedMonths.map((monthYear) => (
        <div key={monthYear} className="mb-10 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            {monthYear}
          </h2>
          <Table>
            <TableCaption>Bookings for {monthYear}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Client</TableHead>
                <TableHead>Studio</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[250px]">Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedBookings[monthYear].map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.full_name}</div>
                    <div className="text-xs text-muted-foreground break-all">
                      {booking.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.studio_slug?.replace("-", " ") ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {booking.event_date ? (
                      new Date(booking.event_date).toLocaleDateString("en-GB")
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {booking.package_name ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        booking.status === "New" ? "default" : "secondary"
                      }
                    >
                      {booking.status ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AssignPhotographers
                      bookingId={booking.id}
                      currentAssignments={booking.assigned_photographers || []}
                      userRole={userRole}
                      availableStaff={availableStaff.map((m) => ({
                        id: String(m.id),
                        full_name: m.name,
                      }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
