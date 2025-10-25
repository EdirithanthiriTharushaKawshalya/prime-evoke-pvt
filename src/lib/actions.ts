// actions.ts - Full updated file
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// actions.ts - Only showing the updated generateMonthlyReport function
export async function generateMonthlyReport(month: string, year: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Security Check: Only management can generate reports
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can generate reports." };
  }

  try {
    // Calculate date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    // Fetch bookings for the specific month
    const { data: bookings, error: bookingsError } = await supabase
      .from('client_bookings')
      .select('*')
      .gte('event_date', startDate.split('T')[0])
      .lte('event_date', endDate.split('T')[0])
      .order('event_date', { ascending: true });

    if (bookingsError) throw bookingsError;

    // Fetch all packages for price calculation
    const { data: packages, error: packagesError } = await supabase
      .from('services')
      .select('*');

    if (packagesError) throw packagesError;

    // Fetch team members for staff assignment tracking
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*');

    if (membersError) throw membersError;

    // Generate Excel report
    const { generateMonthlyExcelReport } = await import('@/lib/excelExport');
    const excelBlob = await generateMonthlyExcelReport({
      bookings: bookings || [],
      packages: packages || [],
      teamMembers: teamMembers || [],
      month,
      year
    });

    // Convert blob to base64 for response
    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { 
      success: true, 
      data: base64,
      fileName: `bookings-report-${month}-${year}.xlsx`
    };

  } catch (error) {
    console.error("Error generating monthly report:", error);
    return { error: "Failed to generate report" };
  }
}

// --- updateBookingAssignments function ---
export async function updateBookingAssignments(
  bookingId: number,
  newAssignments: string[]
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  // Fetch user profile to verify role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { error: profileError.message };
  }

  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can assign photographers." };
  }

  // Update the booking assignments
  const { error: updateError } = await supabase
    .from('client_bookings')
    .update({ assigned_photographers: newAssignments })
    .eq('id', bookingId);

  if (updateError) {
    console.error("Error updating assignments:", updateError);
    return { error: updateError.message };
  }

  // Revalidate page to reflect changes
  revalidatePath('/admin/bookings');

  return { success: true };
}

// --- updateBookingStatus function ---
export async function updateBookingStatus(bookingId: number, newStatus: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Security Check: Ensure user is authenticated and management
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { error: profileError.message };
  }

  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can update status." };
  }

  // Validate Status
  const validStatuses = ["New", "Contacted", "Confirmed", "Completed", "Cancelled"];
  if (!validStatuses.includes(newStatus)) {
    return { error: "Invalid status value." };
  }

  // Perform the database update
  const { error: updateError } = await supabase
    .from('client_bookings')
    .update({ status: newStatus })
    .eq('id', bookingId);

  if (updateError) {
    console.error("Error updating booking status:", updateError);
    return { error: updateError.message };
  }

  // Revalidate the path to refresh data on the admin page
  revalidatePath('/admin/bookings');
  return { success: true };
}

// --- deleteBooking function ---
export async function deleteBooking(bookingId: number) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Security Check: Ensure user is authenticated and management
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { error: profileError.message };
  }

  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can delete bookings." };
  }

  // Perform the deletion
  const { error: deleteError } = await supabase
    .from('client_bookings')
    .delete()
    .eq('id', bookingId);

  if (deleteError) {
    console.error("Error deleting booking:", deleteError);
    return { error: deleteError.message };
  }

  // Revalidate the path to refresh data on the admin page
  revalidatePath('/admin/bookings');
  return { success: true };
}

// --- getBookingStats function (Optional: For dashboard) ---
export async function getBookingStats() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  // Get total bookings count
  const { count: totalBookings, error: totalError } = await supabase
    .from('client_bookings')
    .select('*', { count: 'exact', head: true });

  // Get new bookings count (status = 'New')
  const { count: newBookings, error: newError } = await supabase
    .from('client_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'New');

  // Get confirmed bookings count (status = 'Confirmed')
  const { count: confirmedBookings, error: confirmedError } = await supabase
    .from('client_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Confirmed');

  // Get upcoming bookings (event_date in future)
  const today = new Date().toISOString().split('T')[0];
  const { count: upcomingBookings, error: upcomingError } = await supabase
    .from('client_bookings')
    .select('*', { count: 'exact', head: true })
    .gte('event_date', today)
    .neq('status', 'Cancelled');

  if (totalError || newError || confirmedError || upcomingError) {
    console.error("Error fetching booking stats:", { totalError, newError, confirmedError, upcomingError });
    return { error: "Failed to fetch booking statistics" };
  }

  return {
    total: totalBookings || 0,
    new: newBookings || 0,
    confirmed: confirmedBookings || 0,
    upcoming: upcomingBookings || 0,
  };
}

// --- getRecentBookings function (Optional: For dashboard) ---
export async function getRecentBookings(limit: number = 5) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Check if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  const { data: bookings, error } = await supabase
    .from('client_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent bookings:", error);
    return { error: error.message };
  }

  return { bookings };
}

// --- updateBooking function (For comprehensive updates) ---
export async function updateBooking(
  bookingId: number,
  updates: {
    full_name?: string;
    email?: string;
    event_type?: string;
    package_name?: string;
    event_date?: string;
    message?: string;
    status?: string;
    assigned_photographers?: string[];
  }
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Security Check: Ensure user is authenticated and management
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("Error fetching session:", sessionError);
    return { error: sessionError.message };
  }
  if (!session) return { error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { error: profileError.message };
  }

  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can update bookings." };
  }

  // Perform the update
  const { error: updateError } = await supabase
    .from('client_bookings')
    .update(updates)
    .eq('id', bookingId);

  if (updateError) {
    console.error("Error updating booking:", updateError);
    return { error: updateError.message };
  }

  // Revalidate the path to refresh data on the admin page
  revalidatePath('/admin/bookings');
  return { success: true };
}