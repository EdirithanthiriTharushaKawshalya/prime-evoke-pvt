// actions.ts
"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  Booking, 
  PhotographerFinancialDetail, 
  OrderedItem, 
  ProductOrder,
  ProductOrderPhotographerCommission,
  FinancialRecord,
  RentalBooking,
  RentalEquipment,
  RentalTeamCommission,
  BoothEvent,
  BoothItem,
  BoothOrder
} from '@/lib/types';

// --- Types for Analytics & Reports (Locally defined to fix 'any' issues) ---

interface AnalyticsBooking {
  id: number;
  event_date: string | null;
  assigned_photographers: string[] | null;
  assigned_editor: string | null;
  event_type: string | null;
  financial_entry?: {
    package_amount: number | null;
    final_amount: number | null;
  } | null;
}

interface AnalyticsRental {
  id: number;
  start_date: string;
  total_amount: number;
}

interface AnalyticsOrder {
  id: number;
  created_at: string;
  total_amount: number;
  assigned_photographers: string[] | null;
}

interface RawEditingEarning {
  editor_expenses: number;
  booking: {
    inquiry_id: string | null;
    event_date: string | null;
  } | {
    inquiry_id: string | null;
    event_date: string | null;
  }[]; 
}

// --- Helper function to create Supabase client ---
async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
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
}

// --- generateMonthlyReport function ---
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
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    // --- Fetch Bookings (existing) ---
    const { data: bookings, error: bookingsError } = await supabase
      .from('client_bookings')
      .select('*')
      .gte('event_date', startDate.split('T')[0])
      .lte('event_date', endDate.split('T')[0])
      .order('event_date', { ascending: true });

    if (bookingsError) throw bookingsError;
      
    // --- Fetch Product Orders (existing) ---
    const { data: productOrders, error: ordersError } = await supabase
      .from('product_orders')
      .select('*')
      .gte('created_at', startDate) 
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
      
    if (ordersError) throw ordersError;

    // --- UPDATED: Fetch Rental Bookings with Financials ---
    const { data: rentalBookingsRaw } = await supabase
      .from('rental_bookings')
      .select('*, items:rental_order_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    let rentalBookings = [];
    
    if (rentalBookingsRaw && rentalBookingsRaw.length > 0) {
       const rentalIds = rentalBookingsRaw.map(r => r.id);
       
       // Fetch Financials
       const { data: rFinancials } = await supabase
         .from('rental_financial_entries')
         .select('*')
         .in('rental_id', rentalIds);

       // Fetch Commissions
       const { data: rCommissions } = await supabase
         .from('rental_team_commissions')
         .select('*')
         .in('rental_id', rentalIds);

       rentalBookings = rentalBookingsRaw.map(r => {
          const entry = rFinancials?.find(f => f.rental_id === r.id);
          const details = rCommissions?.filter(c => c.rental_id === r.id);
          return {
             ...r,
             financial_entry: entry ? { ...entry, team_details: details } : null
          };
       });
    }

    // --- UPDATE: Fetch Financial Records with staff data ---
    const { data: financialRecords } = await supabase
      .from('other_financial_records')
      .select('*, staff_member:team_members(name)') // Fetch staff name
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: true });

    const { data: packages, error: packagesError } = await supabase
      .from('services')
      .select('*');
    if (packagesError) throw packagesError;

    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*');
    if (membersError) throw membersError;

    // --- Process Bookings with Financials (existing) ---
    let bookingsWithFinancial: Booking[] = [];
    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);
      const { data: financialEntries, error: financialError } = await supabase
        .from('financial_entries')
        .select('*')
        .in('booking_id', bookingIds);

      if (!financialError && financialEntries) {
        const { data: photographerDetails, error: photographerError } = await supabase
          .from('photographer_financial_details')
          .select('*')
          .in('booking_id', bookingIds);
        
        bookingsWithFinancial = bookings.map(booking => {
            const entry = financialEntries.find(fe => fe.booking_id === booking.id);
            const details = photographerError ? [] : photographerDetails?.filter(pd => pd.booking_id === booking.id);
            return {
                ...booking,
                financial_entry: entry ? { ...entry, photographer_details: details } : null
            };
        }) as Booking[];
      } else {
        bookingsWithFinancial = bookings as Booking[];
      }
    }

    // --- Process Product Orders with Financials ---
    let productOrdersWithFinancial: ProductOrder[] = [];
    if (productOrders && productOrders.length > 0) {
      const orderIds = productOrders.map(o => o.id);

      // Fetch main financial entries
      const { data: poFinancialEntries, error: poFinancialError } = await supabase
        .from('product_order_financial_entries')
        .select('*')
        .in('order_id', orderIds);

      // Fetch photographer commission details
      const { data: poPhotographerDetails, error: poPhotographerError } = await supabase
        .from('product_order_photographer_commission')
        .select('*')
        .in('order_id', orderIds);

      productOrdersWithFinancial = productOrders.map(order => {
        const entry = poFinancialError ? null : poFinancialEntries?.find(fe => fe.order_id === order.id);
        const details = poPhotographerError ? [] : poPhotographerDetails?.filter(pd => pd.order_id === order.id);
        return {
          ...order,
          financial_entry: entry ? { ...entry, photographer_details: details } : null
        };
      }) as ProductOrder[];

    } else {
      productOrdersWithFinancial = productOrders as ProductOrder[];
    }

    // --- Generate Excel Report ---
    const { generateMonthlyExcelReport } = await import('@/lib/excelExport');
    const excelBlob = await generateMonthlyExcelReport({
      bookings: bookingsWithFinancial || [],
      packages: packages || [],
      teamMembers: teamMembers || [],
      productOrders: productOrdersWithFinancial || [],
      rentalBookings: (rentalBookings as RentalBooking[]) || [], // Pass Rentals with financials
      financialRecords: (financialRecords as FinancialRecord[]) || [], // Pass Financials
      month,
      year
    });

    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { 
      success: true, 
      data: base64,
      fileName: `report-${month}-${year}.xlsx`
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

// --- UPDATE: updateFinancialEntry function ---
export async function updateFinancialEntry(
  bookingId: number,
  financialData: {
    package_category?: string;
    package_name?: string;
    package_amount?: number;
    photographer_expenses?: number;
    videographer_expenses?: number;
    editor_expenses?: number;
    editor_name?: string; // NEW: Accept editor_name field
    company_expenses?: number;
    other_expenses?: number;
    final_amount?: number;
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
    return { error: "Permission denied. Only management can update financial data." };
  }

  try {
    // Check if financial entry already exists
    const { data: existingEntry } = await supabase
      .from('financial_entries')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    let result;
    
    if (existingEntry) {
      // Update existing entry
      result = await supabase
        .from('financial_entries')
        .update(financialData)
        .eq('booking_id', bookingId);
    } else {
      // Create new entry
      result = await supabase
        .from('financial_entries')
        .insert([{ booking_id: bookingId, ...financialData }]);
    }

    if (result.error) {
      console.error("Error updating financial entry:", result.error);
      return { error: result.error.message };
    }

    // Revalidate the path to refresh data
    revalidatePath('/admin/bookings');
    return { success: true };

  } catch (error) {
    console.error("Error in updateFinancialEntry:", error);
    return { error: "Failed to update financial data" };
  }
}

// --- updatePhotographerFinancialDetails function ---
export async function updatePhotographerFinancialDetails(
  bookingId: number,
  photographerDetails: PhotographerFinancialDetail[]
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
    return { error: "Permission denied. Only management can update financial data." };
  }

  try {
    // Delete existing photographer details for this booking
    const { error: deleteError } = await supabase
      .from('photographer_financial_details')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) {
      console.error("Error deleting old photographer details:", deleteError);
      return { error: deleteError.message };
    }

    // Insert new photographer details (only those with amount > 0)
    const detailsToInsert = photographerDetails.filter(detail => detail.amount > 0);
    
    if (detailsToInsert.length > 0) {
      // Fix: insertError was unused, now we check it.
      const { error: insertError } = await supabase
        .from('photographer_financial_details')
        .insert(detailsToInsert.map(detail => ({
          booking_id: bookingId,
          staff_name: detail.staff_name,
          amount: detail.amount
        })));
        
      if (insertError) {
        throw insertError;
      }
    }

    // Revalidate the path to refresh data
    revalidatePath('/admin/bookings');
    return { success: true };

  } catch (error) {
    console.error("Error in updatePhotographerFinancialDetails:", error);
    return { error: "Failed to update photographer financial details" };
  }
}

// --- getFinancialEntries function ---
export async function getFinancialEntries(bookingIds: number[]) {
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

  const { data: financialEntries, error } = await supabase
    .from('financial_entries')
    .select('*')
    .in('booking_id', bookingIds);

  if (error) {
    console.error("Error fetching financial entries:", error);
    return { error: error.message };
  }

  // ✅ Fetch photographer details for these bookings
  if (financialEntries && financialEntries.length > 0) {
    const { data: photographerDetails, error: photographerError } = await supabase
      .from('photographer_financial_details')
      .select('*')
      .in('booking_id', bookingIds);

    if (!photographerError && photographerDetails) {
      // Map photographer details to financial entries
      const entriesWithDetails = financialEntries.map(entry => ({
        ...entry,
        photographer_details: photographerDetails.filter(detail => detail.booking_id === entry.booking_id)
      }));

      return { financialEntries: entriesWithDetails };
    }
  }

  return { financialEntries };
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

// --- getPhotographerMonthlyEarnings function ---
export async function getPhotographerMonthlyEarnings(month: string, year: string) {
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

  // Security Check: Only management can access earnings data
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
    return { error: "Permission denied. Only management can access earnings data." };
  }

  try {
    // Calculate date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    // Fetch bookings for the specific month
    const { data: bookings, error: bookingsError } = await supabase
      .from('client_bookings')
      .select('id, inquiry_id, event_date')
      .gte('event_date', startDate.split('T')[0])
      .lte('event_date', endDate.split('T')[0]);

    if (bookingsError) throw bookingsError;

    if (!bookings || bookings.length === 0) {
      return { earnings: [] };
    }

    const bookingIds = bookings.map(b => b.id);

    // Fetch photographer financial details for these bookings
    const { data: photographerDetails, error: photographerError } = await supabase
      .from('photographer_financial_details')
      .select('*')
      .in('booking_id', bookingIds);

    if (photographerError) throw photographerError;

    // Calculate earnings by photographer
    const earningsByPhotographer: { [key: string]: { 
      totalEarnings: number; 
      eventCount: number;
      events: Array<{ inquiry_id: string; event_date: string; amount: number }>
    } } = {};

    photographerDetails?.forEach(detail => {
      const booking = bookings.find(b => b.id === detail.booking_id);
      if (!earningsByPhotographer[detail.staff_name]) {
        earningsByPhotographer[detail.staff_name] = {
          totalEarnings: 0,
          eventCount: 0,
          events: []
        };
      }
      
      earningsByPhotographer[detail.staff_name].totalEarnings += detail.amount;
      earningsByPhotographer[detail.staff_name].eventCount += 1;
      earningsByPhotographer[detail.staff_name].events.push({
        inquiry_id: booking?.inquiry_id || 'Unknown',
        event_date: booking?.event_date || 'Unknown',
        amount: detail.amount
      });
    });

    // Convert to array and sort by total earnings
    const earnings = Object.entries(earningsByPhotographer)
      .map(([staffName, data]) => ({
        staffName,
        totalEarnings: data.totalEarnings,
        eventCount: data.eventCount,
        averageEarnings: data.eventCount > 0 ? data.totalEarnings / data.eventCount : 0,
        events: data.events
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings);

    return { earnings };

  } catch (error) {
    console.error("Error fetching photographer earnings:", error);
    return { error: "Failed to fetch photographer earnings" };
  }
}

// --- updateProductOrderAssignments function ---
export async function updateProductOrderAssignments(
  orderId: number,
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

  // Security Check: Ensure user is authenticated and management
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError.message };
  if (!session) return { error: "Not authenticated" };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError) return { error: profileError.message };
  if (profile?.role !== 'management') {
    return { error: "Permission denied. Only management can assign staff." };
  }

  // Update the product_orders assignments
  const { error: updateError } = await supabase
    .from('product_orders')
    .update({ assigned_photographers: newAssignments })
    .eq('id', orderId);

  if (updateError) {
    console.error("Error updating order assignments:", updateError);
    return { error: updateError.message };
  }

  revalidatePath('/admin/bookings');
  return { success: true };
}

// --- updateProductOrderFinancialEntry function ---
export async function updateProductOrderFinancialEntry(
  orderId: number,
  financialData: {
    order_amount: number;
    studio_fee: number;
    other_expenses: number;
    profit: number;
    photographer_commission_total: number;
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
    return { error: "Permission denied. Only management can update financial data." };
  }

  try {
    const { error } = await supabase
      .from('product_order_financial_entries')
      .upsert({ 
        order_id: orderId, 
        ...financialData 
      }, { onConflict: 'order_id' });

    if (error) throw error;

    revalidatePath('/admin/bookings');
    return { success: true };

  } catch (error: unknown) {
    console.error("Error updating product financial entry:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

// --- updateProductOrderPhotographerCommission function ---
export async function updateProductOrderPhotographerCommission(
  orderId: number,
  photographerDetails: ProductOrderPhotographerCommission[]
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

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  try {
    const { error: deleteError } = await supabase
      .from('product_order_photographer_commission')
      .delete()
      .eq('order_id', orderId);

    if (deleteError) throw deleteError;

    const detailsToInsert = photographerDetails
      .filter(detail => detail.amount > 0)
      .map(detail => ({
        order_id: orderId,
        staff_name: detail.staff_name,
        amount: detail.amount
      }));
    
    if (detailsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('product_order_photographer_commission')
        .insert(detailsToInsert);

      if (insertError) throw insertError;
    }

    revalidatePath('/admin/bookings');
    return { success: true };

  } catch (error: unknown) {
    console.error("Error in updateProductOrderPhotographerCommission:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

// --- UPDATED: Submit Product Order ---
export async function submitProductOrder(formData: {
    customer_name: string;
    customer_email: string;
    customer_mobile: string | null;
    ordered_items: OrderedItem[];
    total_amount: number;
    studio_slug: string; 
}) {
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

    const generateOrderId = (): string => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ORD-${timestamp}-${random}`.toUpperCase();
    };

    const orderId = generateOrderId();

    try {
        // 1. Create the Product Order
        const { data: orderData, error: orderError } = await supabase
            .from('product_orders')
            .insert([{
                order_id: orderId,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_mobile: formData.customer_mobile,
                ordered_items: formData.ordered_items,
                total_amount: formData.total_amount,
                status: 'New',
                studio_slug: formData.studio_slug, 
                assigned_photographers: [], 
            }])
            .select('id, order_id')
            .single();

        if (orderError) throw orderError;

        // 2. PROCESS STOCK REDUCTION (Updated Logic for Albums)
        
        for (const item of formData.ordered_items) {
            const sizeToSearch = item.size; // e.g., "12x18" or "A4"
            
            // Determine which categories to reduce based on item type
            const categoriesToReduce: string[] = [];
            
            // Logic specific variables
            let searchKeyword = sizeToSearch; 
            let qtyToReduce = item.quantity;

            if (item.type === 'print') {
                // Buying a Print -> Reduce Paper
                categoriesToReduce.push('Paper');
            } else if (item.type === 'frame') {
                // Buying a Frame -> Reduce Frame AND Reduce Paper
                categoriesToReduce.push('Frame');
                categoriesToReduce.push('Paper');
            } else if (item.type === 'album') {
                // Buying an Album -> Reduce Paper (Double Side Card)
                categoriesToReduce.push('Paper');
                
                // SPECIAL LOGIC FOR ALBUMS:
                // 1. We specifically look for "Double Side" paper
                searchKeyword = "Double Side"; 
                
                // 2. Calculate sheets needed: 
                // (Page Count / 2) because it's double-sided * Quantity of albums
                const pages = item.page_count || 0;
                const sheetsPerAlbum = Math.ceil(pages / 2); 
                qtyToReduce = item.quantity * sheetsPerAlbum;
            }

            // Execute reduction for each required category
            for (const category of categoriesToReduce) {
                
                // Build the query
                let query = supabase
                    .from('inventory_stock')
                    .select('*')
                    .eq('category', category);

                if (item.type === 'album') {
                    // For albums, look for "Double Side" AND the size (e.g. "A4")
                    query = query
                        .ilike('item_name', `%${searchKeyword}%`)
                        .ilike('item_name', `%${item.size}%`);
                } else {
                    // For prints/frames, just look for the size in the name
                    query = query.ilike('item_name', `%${searchKeyword}%`);
                }

                const { data: stockItems } = await query.limit(1);

                if (stockItems && stockItems.length > 0) {
                    const stockItem = stockItems[0];
                    
                    const newQuantity = stockItem.quantity - qtyToReduce;

                    // Perform update
                    const { error: stockError } = await supabase
                        .from('inventory_stock')
                        .update({ 
                            quantity: newQuantity, 
                            last_updated: new Date().toISOString() 
                        })
                        .eq('id', stockItem.id);

                    if (!stockError) {
                        // Record Movement
                        await supabase.from('inventory_movements').insert({
                            stock_item_id: stockItem.id,
                            type: 'Sale',
                            quantity_change: -qtyToReduce, // Negative for sale
                            previous_quantity: stockItem.quantity,
                            new_quantity: newQuantity,
                            notes: `Order ${orderId} - ${item.type} (${item.size})`
                        });
                    }
                }
            }
        }

        revalidatePath('/admin/bookings');
        revalidatePath('/admin/stock');
        
        return { success: true, orderId: orderData?.order_id };

    } catch (error: unknown) {
        console.error("Product order submission error:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { error: message };
    }
}

// --- updateProductOrderStatus function ---
export async function updateProductOrderStatus(
  orderId: number,
  newStatus: string
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
    return { error: "Permission denied. Only management can update order status." };
  }

  // Validate Status
  const validStatuses = ["New", "In Progress", "Completed", "Cancelled"];
  if (!validStatuses.includes(newStatus)) {
    return { error: "Invalid status value." };
  }

  // Perform the database update
  const { error: updateError } = await supabase
    .from('product_orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (updateError) {
    console.error("Error updating product order status:", updateError);
    return { error: updateError.message };
  }

  // Revalidate the path to refresh data on the admin page
  revalidatePath('/admin/bookings');
  return { success: true };
}

// --- deleteProductOrder function ---
export async function deleteProductOrder(orderId: number) {
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
    return { error: "Permission denied. Only management can delete orders." };
  }

  // Perform the deletion
  const { error: deleteError } = await supabase
    .from('product_orders')
    .delete()
    .eq('id', orderId);

  if (deleteError) {
    console.error("Error deleting product order:", deleteError);
    return { error: deleteError.message };
  }

  // Revalidate the path to refresh data on the admin page
  revalidatePath('/admin/bookings');
  return { success: true };
}

// --- getProductOrderFinancialEntries function ---
export async function getProductOrderFinancialEntries(orderIds: number[]) {
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

  const { data: financialEntries, error } = await supabase
    .from('product_order_financial_entries')
    .select('*')
    .in('order_id', orderIds);

  if (error) {
    console.error("Error fetching product order financial entries:", error);
    return { error: error.message };
  }

  // ✅ Fetch photographer commission details for these orders
  if (financialEntries && financialEntries.length > 0) {
    const { data: photographerDetails, error: photographerError } = await supabase
      .from('product_order_photographer_commission')
      .select('*')
      .in('order_id', orderIds);

    if (!photographerError && photographerDetails) {
      // Map photographer details to financial entries
      const entriesWithDetails = financialEntries.map(entry => ({
        ...entry,
        photographer_details: photographerDetails.filter(detail => detail.order_id === entry.order_id)
      }));

      return { financialEntries: entriesWithDetails };
    }
  }

  return { financialEntries };
}

// --- updateProductOrder function ---
export async function updateProductOrder(
  orderId: number,
  updates: {
    customer_name?: string;
    customer_email?: string;
    customer_mobile?: string;
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
    return { error: "Permission denied. Only management can update product orders." };
  }

  // Perform the update
  const { error: updateError } = await supabase
    .from('product_orders')
    .update(updates)
    .eq('id', orderId);

  if (updateError) {
    console.error("Error updating product order:", updateError);
    return { error: updateError.message };
  }

  // NO revalidatePath needed, router.refresh() will handle it
  return { success: true };
}

// --- UPDATE: generateMySalaryReport function ---
export async function generateMySalaryReport(month: string, year: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .single();

  if (!profile?.full_name) return { error: "Profile not found" };
  const userName = profile.full_name;

  try {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    // 1. Photography Earnings (Existing)
    const { data: bookingEarnings } = await supabase
      .from('photographer_financial_details')
      .select('*, booking:client_bookings!inner(inquiry_id, event_date)')
      .eq('staff_name', userName)
      .gte('booking.event_date', startDate.split('T')[0])
      .lte('booking.event_date', endDate.split('T')[0]);

    // 2. Product Commissions (Existing)
    const { data: productEarnings } = await supabase
      .from('product_order_photographer_commission')
      .select('*, order:product_orders!inner(order_id, created_at)')
      .eq('staff_name', userName)
      .gte('order.created_at', startDate)
      .lte('order.created_at', endDate);

    // 3. Editing Earnings
    const { data: editingEarningsRaw } = await supabase
      .from('financial_entries')
      .select('editor_expenses, booking:client_bookings!inner(inquiry_id, event_date)')
      .eq('editor_name', userName)
      .gt('editor_expenses', 0)
      .gte('booking.event_date', startDate.split('T')[0])
      .lte('booking.event_date', endDate.split('T')[0]);
      
    // 4. Rental Commissions (From previous task)
    const { data: rentalEarnings } = await supabase
      .from('rental_team_commissions')
      .select('*, rental:rental_bookings!inner(booking_id, created_at)')
      .eq('staff_name', userName)
      .gte('rental.created_at', startDate)
      .lte('rental.created_at', endDate);

    // 5. --- NEW: Other Financial Records (Allowances/Bonuses) ---
    // First, find the team_member ID for this user
    const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('name', userName) // Assuming profile name matches team name
        .single();

    // Fix: Explicitly type this as FinancialRecord[]
    let otherSalaryRecords: FinancialRecord[] = [];
    
    if (teamMember) {
        const { data: records } = await supabase
            .from('other_financial_records')
            .select('*')
            .eq('staff_id', teamMember.id)
            .eq('type', 'Expense') // Only expenses count as payment to staff
            .gte('date', startDate.split('T')[0])
            .lte('date', endDate.split('T')[0]);
            
        // Explicit cast here is safe because Supabase select('*') matches FinancialRecord structure
        otherSalaryRecords = (records as FinancialRecord[]) || [];
    }

    // Generate Report
    const { generateUserSalaryReport } = await import('@/lib/excelExport');
    
    // Fix: Type the raw editing data using the interface
    const editingEarnings = ((editingEarningsRaw as unknown as RawEditingEarning[]) || []).map((item) => {
      const booking = Array.isArray(item.booking) ? item.booking[0] : item.booking;
      return {
        editor_expenses: item.editor_expenses,
        booking: {
          inquiry_id: booking?.inquiry_id ?? undefined,
          event_date: booking?.event_date ?? undefined
        }
      };
    });

    const excelBlob = await generateUserSalaryReport({
      bookingEarnings: bookingEarnings || [],
      productEarnings: productEarnings || [],
      editingEarnings: editingEarnings,
      rentalEarnings: rentalEarnings || [],
      otherSalaryRecords, 
      userName,
      month,
      year
    });

    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { 
      success: true, 
      data: base64, 
      fileName: `Salary-${userName}-${month}-${year}.xlsx` 
    };

  } catch (error: unknown) {
    console.error("Error generating salary report:", error);
    const message = error instanceof Error ? error.message : "Failed to generate salary report";
    return { error: message };
  }
}

// --- UPDATE: addFinancialRecord ---
export async function addFinancialRecord(data: Omit<FinancialRecord, 'id' | 'created_at' | 'staff_member'>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // ... Auth Checks (Management Only) ...
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('other_financial_records').insert([data]);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/financials');
  return { success: true };
}

// --- UPDATE: updateFinancialRecord ---
export async function updateFinancialRecord(
  id: number,
  data: {
    date: string;
    description: string;
    type: 'Income' | 'Expense';
    category: string;
    amount: number;
    payment_method: string;
    staff_id?: number | null; // <--- Accept staff_id
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // ... Auth Checks ...
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase
    .from('other_financial_records')
    .update(data)
    .eq('id', id);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/financials');
  return { success: true };
}

// --- STOCK ACTIONS ---

// 1. Add New Item (For when you get a totally new product)
export async function addStockItem(data: {
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  // Insert Item
  const { data: newItem, error } = await supabase
    .from('inventory_stock')
    .insert([data])
    .select()
    .single();
  
  if (error) return { error: error.message };

  // Record Initial Movement
  if (newItem) {
    await supabase.from('inventory_movements').insert({
      stock_item_id: newItem.id,
      type: 'Initial',
      quantity_change: data.quantity,
      previous_quantity: 0,
      new_quantity: data.quantity,
      notes: 'Item Created',
      user_id: session.user.id // <--- ADDED THIS
    });
  }

  revalidatePath('/admin/stock');
  return { success: true };
}

// 2. Restock Item (Add to existing quantity)
export async function restockItem(id: number, amountToAdd: number, currentQty: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const newQuantity = currentQty + amountToAdd;

  // Update stock
  const { error } = await supabase
    .from('inventory_stock')
    .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  // Record Movement WITH USER ID
  await supabase.from('inventory_movements').insert({
    stock_item_id: id,
    type: 'Restock',
    quantity_change: amountToAdd,
    previous_quantity: currentQty,
    new_quantity: newQuantity,
    notes: 'Manual Restock',
    user_id: session.user.id // <--- ADDED THIS
  });

  revalidatePath('/admin/stock');
  return { success: true };
}

// 3. Edit Item Details (Name, Price, etc.)
export async function updateStockItem(
  id: number, 
  data: {
    item_name?: string;
    category?: string;
    unit_price?: number;
    reorder_level?: number;
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase
    .from('inventory_stock')
    .update({ ...data, last_updated: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin/stock');
  return { success: true };
}

// 4. Delete Item
export async function deleteStockItem(id: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('inventory_stock').delete().eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/stock');
  return { success: true };
}

// --- RENTAL INVENTORY ACTIONS ---

export async function addRentalEquipment(data: Omit<RentalEquipment, 'id' | 'created_at' | 'is_active'>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check (Management Only)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('rental_equipment').insert([data]);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

export async function updateRentalEquipment(id: number, data: Partial<RentalEquipment>) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check (Management Only)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('rental_equipment').update(data).eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

export async function deleteRentalEquipment(id: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check (Management Only)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('rental_equipment').delete().eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

// --- RENTAL BOOKING ACTIONS ---

export async function updateRentalBookingStatus(id: number, status: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check (Management Only)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('rental_bookings').update({ status }).eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

// --- UPDATED: submitRentalBooking ---
export async function submitRentalBooking(formData: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: Date;
  endDate: Date;
  storeId: string;
  items: { equipmentId: string; quantity: number }[];
  totalCost: number;
  // New Verification Fields
  clientAddress: string;
  idFrontPath: string;
  idBackPath: string;
  selfiePath: string;
}) {
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

  try {
    // Call the PostgreSQL function
    const { data: bookingId, error: bookingError } = await supabase.rpc(
      'submit_rental_with_verification',
      {
        p_client_name: formData.clientName,
        p_client_email: formData.clientEmail,
        p_client_phone: formData.clientPhone,
        p_start_date: formData.startDate.toISOString(),
        p_end_date: formData.endDate.toISOString(),
        p_store_id: formData.storeId,
        p_total_cost: formData.totalCost,
        p_client_address: formData.clientAddress,
        p_id_front_path: formData.idFrontPath,
        p_id_back_path: formData.idBackPath,
        p_selfie_path: formData.selfiePath,
        p_items: formData.items,
      }
    );

    if (bookingError) {
      console.error("Database Error:", bookingError);
      throw new Error(bookingError.message);
    }

    revalidatePath('/admin/rentals');
    
    // Return success (ensure ID is a number)
    return { success: true, bookingId: Number(bookingId) };

  } catch (error: unknown) {
    console.error("Submit Rental Error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit booking.";
    return { error: message };
  }
}

// --- UPDATED: Get Verification Details (Securely generate signed URLs) ---
export async function getRentalVerificationDetails(bookingId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Security Check (Still keep this so only admins can request the data)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'management') {
    throw new Error("Unauthorized access");
  }

  // Fetch paths from DB
  const { data: verificationData, error } = await supabase
    .from('rental_verifications')
    .select('*')
    .eq('booking_id', bookingId) 
    .single();

  if (error || !verificationData) {
    throw new Error("Verification documents not found.");
  }

  // Helper to get PUBLIC URL
  const getPublicDocUrl = (path: string) => {
    if (!path) return "";
    const { data } = supabase.storage
      .from('private-documents') // Bucket name
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  return {
    address: verificationData.client_address,
    idFrontUrl: getPublicDocUrl(verificationData.id_front_path),
    idBackUrl: getPublicDocUrl(verificationData.id_back_path),
    selfieUrl: getPublicDocUrl(verificationData.selfie_path),
  };
}

// --- UPDATED: Update Verification Status ---
export async function updateRentalVerificationStatus(bookingId: string, status: 'verified' | 'rejected') {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Security Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'management') return { error: "Unauthorized" };

  // Update Status
  const { error } = await supabase
    .from('rental_bookings')
    .update({ verification_status: status })
    .eq('id', bookingId);

  if (error) return { error: error.message };

  revalidatePath('/admin/rentals');
  return { success: true };
}

// --- Delete Rental Booking ---
export async function deleteRentalBooking(bookingId: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('rental_bookings').delete().eq('id', bookingId);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

// --- Update Rental Booking Details ---
export async function updateRentalBooking(
  bookingId: number, 
  data: {
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    status?: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase
    .from('rental_bookings')
    .update(data)
    .eq('id', bookingId);

  if (error) return { error: error.message };
  revalidatePath('/admin/rentals');
  return { success: true };
}

// --- NEW: Record Waste / Spoilage ---
export async function recordWasteItem(
  itemId: number, 
  quantity: number, 
  reason: string
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // 1. Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  
  // Note: Even normal staff might need to record waste, but let's keep it restricted for now if you prefer
  if (profile?.role !== 'management') return { error: "Permission denied." };

  // 2. Get current stock
  const { data: currentItem } = await supabase
    .from('inventory_stock')
    .select('quantity')
    .eq('id', itemId)
    .single();

  if (!currentItem) return { error: "Item not found" };

  // 3. Calculate new quantity
  const newQuantity = currentItem.quantity - quantity;

  // 4. Update Stock
  const { error: updateError } = await supabase
    .from('inventory_stock')
    .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
    .eq('id', itemId);

  if (updateError) return { error: updateError.message };

  // 5. Record Movement (Type: 'Waste')
  const { error: moveError } = await supabase.from('inventory_movements').insert({
    stock_item_id: itemId,
    type: 'Waste', // <--- Distinct type for filtering later
    quantity_change: -quantity, // Negative number
    previous_quantity: currentItem.quantity,
    new_quantity: newQuantity,
    notes: reason, // e.g., "Printer Jam"
    user_id: session.user.id
  });

  if (moveError) return { error: moveError.message };

  revalidatePath('/admin/stock');
  return { success: true };
}

// --- NEW: Get Calendar Data ---
export async function getCalendarData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  // 1. Fetch Bookings (Photography Sessions)
  const { data: bookings } = await supabase
    .from('client_bookings')
    .select('id, full_name, event_type, event_date, status, inquiry_id')
    .neq('status', 'Cancelled');

  // 2. Fetch Rentals (Equipment Duration)
  const { data: rentals } = await supabase
    .from('rental_bookings')
    .select('id, client_name, start_date, end_date, status, booking_id')
    .neq('status', 'Cancelled');

  // 3. Fetch Product Orders (Using Created Date as the "Order Date")
  const { data: orders } = await supabase
    .from('product_orders')
    .select('id, customer_name, created_at, status, order_id')
    .neq('status', 'Cancelled');

  return { 
    bookings: bookings || [], 
    rentals: rentals || [], 
    orders: orders || [] 
  };
}

// --- NEW: Assign Editor ---
export async function updateBookingEditor(
  bookingId: number,
  editorName: string | null
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  // Update
  const { error } = await supabase
    .from('client_bookings')
    .update({ assigned_editor: editorName })
    .eq('id', bookingId);

  if (error) return { error: error.message };

  revalidatePath('/admin/bookings');
  return { success: true };
}

// ---------------------------------------------------------
// RENTAL ASSIGNMENTS
// ---------------------------------------------------------

export async function updateRentalAssignments(
  rentalId: number,
  newAssignments: string[]
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase
    .from('rental_bookings')
    .update({ assigned_team_members: newAssignments })
    .eq('id', rentalId);

  if (error) return { error: error.message };

  revalidatePath('/admin/rentals');
  return { success: true };
}

// ---------------------------------------------------------
// RENTAL FINANCIALS
// ---------------------------------------------------------

export async function updateRentalFinancials(
  rentalId: number,
  financialData: {
    total_revenue: number;
    delivery_expenses: number;
    maintenance_expenses: number;
    other_expenses: number;
    profit: number;
    team_commission_total: number;
  },
  teamDetails: RentalTeamCommission[]
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Auth Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  try {
    // 1. Upsert Main Financial Entry
    const { error: mainError } = await supabase
      .from('rental_financial_entries')
      .upsert({ 
        rental_id: rentalId, 
        ...financialData 
      }, { onConflict: 'rental_id' });

    if (mainError) throw mainError;

    // 2. Handle Team Commissions (Delete old, Insert new)
    const { error: deleteError } = await supabase
      .from('rental_team_commissions')
      .delete()
      .eq('rental_id', rentalId);

    if (deleteError) throw deleteError;

    const detailsToInsert = teamDetails
      .filter(d => d.amount > 0)
      .map(d => ({
        rental_id: rentalId,
        staff_name: d.staff_name,
        amount: d.amount
      }));

    if (detailsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('rental_team_commissions')
        .insert(detailsToInsert);
      
      if (insertError) throw insertError;
    }

    revalidatePath('/admin/rentals');
    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update financials";
    return { error: message };
  }
}

// --- NEW: Get Analytics Data ---
export async function getAnalyticsData(timeRange: '3m' | '6m' | '1y' | 'all') {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  // 1. Calculate Date Range
  const now = new Date();
  let startDate = new Date();
  
  if (timeRange === '3m') startDate.setMonth(now.getMonth() - 3);
  else if (timeRange === '6m') startDate.setMonth(now.getMonth() - 6);
  else if (timeRange === '1y') startDate.setFullYear(now.getFullYear() - 1);
  else startDate = new Date(0); // Beginning of time

  const startIso = startDate.toISOString();

  // 2. Fetch Data
  const { data: bookings } = await supabase
    .from('client_bookings')
    .select(`
      id, 
      event_date, 
      assigned_photographers, 
      assigned_editor, 
      event_type,
      financial_entry:financial_entries(package_amount, final_amount) 
    `)
    .gte('event_date', startIso)
    .neq('status', 'Cancelled');

  const { data: rentals } = await supabase
    .from('rental_bookings')
    .select('id, start_date, total_amount')
    .gte('start_date', startIso)
    .neq('status', 'Cancelled');

  const { data: orders } = await supabase
    .from('product_orders')
    .select('id, created_at, total_amount, assigned_photographers')
    .gte('created_at', startIso)
    .neq('status', 'Cancelled');

  // Fix: Cast the results to the locally defined types immediately
  const typedBookings = (bookings as unknown as AnalyticsBooking[]) || [];
  const typedRentals = (rentals as unknown as AnalyticsRental[]) || [];
  const typedOrders = (orders as unknown as AnalyticsOrder[]) || [];

  // 3. Aggregate Monthly Revenue & Counts
  interface MonthlyData {
    name: string;
    fullDate: string;
    bookings: number;
    rentals: number;
    orders: number;
    revenue: number;
  }
  const monthlyData: Record<string, MonthlyData> = {};

  const processEntry = (dateStr: string, type: 'bookings' | 'rentals' | 'orders', amount: number) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "2025-01"
    
    if (!monthlyData[key]) {
      monthlyData[key] = { 
        name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), 
        fullDate: key,
        bookings: 0, rentals: 0, orders: 0, 
        revenue: 0 
      };
    }
    monthlyData[key][type] += 1;
    monthlyData[key].revenue += amount || 0;
  };

  // Process Bookings
  typedBookings.forEach((b) => {
    const revenue = b.financial_entry?.final_amount || b.financial_entry?.package_amount || 0;
    processEntry(b.event_date || '', 'bookings', revenue);
  });

  // Process Rentals
  typedRentals.forEach(r => processEntry(r.start_date, 'rentals', r.total_amount || 0));
  
  // Process Orders
  typedOrders.forEach(o => processEntry(o.created_at, 'orders', o.total_amount || 0));

  // Convert to array and sort by date
  const chartData = Object.values(monthlyData).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  // 4. Aggregate Staff Performance
  const staffStats: Record<string, { name: string, events: number, edits: number, products: number }> = {};

  // Process Events & Edits
  typedBookings.forEach((b) => {
    if (Array.isArray(b.assigned_photographers)) {
        b.assigned_photographers.forEach((name: string) => {
            if (!staffStats[name]) staffStats[name] = { name, events: 0, edits: 0, products: 0 };
            staffStats[name].events += 1;
        });
    }
    if (b.assigned_editor) {
      const name = b.assigned_editor;
      if (!staffStats[name]) staffStats[name] = { name, events: 0, edits: 0, products: 0 };
      staffStats[name].edits += 1;
    }
  });

  // Process Products
  typedOrders.forEach((o) => {
    if (Array.isArray(o.assigned_photographers)) {
      o.assigned_photographers.forEach((name: string) => {
        if (!staffStats[name]) staffStats[name] = { name, events: 0, edits: 0, products: 0 };
        staffStats[name].products += 1;
      });
    }
  });

  const staffPerformance = Object.values(staffStats).sort((a, b) => 
    (b.events + b.edits + b.products) - (a.events + a.edits + a.products)
  );

  // 5. Category Distribution
  const categoryStats: Record<string, number> = {};
  typedBookings.forEach((b) => {
    const type = b.event_type || 'Other';
    categoryStats[type] = (categoryStats[type] || 0) + 1;
  });
  
  const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

  return {
    chartData,
    staffPerformance,
    categoryData,
    totals: {
      bookings: bookings?.length || 0,
      rentals: rentals?.length || 0,
      orders: orders?.length || 0,
      revenue: chartData.reduce((sum, item) => sum + item.revenue, 0)
    }
  };
}

export async function deleteFinancialRecord(id: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (profile?.role !== 'management') return { error: "Permission denied." };

  const { error } = await supabase.from('other_financial_records').delete().eq('id', id);
  
  if (error) return { error: error.message };
  
  revalidatePath('/admin/financials');
  return { success: true };
}

// --- PHOTO BOOTH ACTIONS ---

// 1. Create Event
export async function createBoothEvent(name: string, date: string) {
  const supabase = await createClient(); // Use your existing helper
  const { error } = await supabase.from('booth_events').insert([{ name, event_date: date }]);
  if (error) return { error: error.message };
  revalidatePath('/booth');
  return { success: true };
}

// 2. Create Item (e.g., Dance Group)
export async function createBoothItem(eventId: number, name: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('booth_items').insert([{ event_id: eventId, name, description }]);
  if (error) return { error: error.message };
  revalidatePath(`/booth/${eventId}`);
  return { success: true };
}

// 3. Add Order (Works for both Item and Other)
export async function addBoothOrder(data: {
  event_id: number;
  item_id: number | null;
  client_name: string;
  phone_number?: string;
  photo_ids: string[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('booth_orders').insert([data]);
  if (error) return { error: error.message };
  
  // Revalidate specific path based on where we came from
  const path = data.item_id 
    ? `/booth/${data.event_id}/item/${data.item_id}` 
    : `/booth/${data.event_id}/other`;
  revalidatePath(path);
  return { success: true };
}

// 4. Update Order Status
export async function updateBoothOrderStatus(orderId: number, status: string, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('booth_orders').update({ status }).eq('id', orderId);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { success: true };
}

// 5. Update Order Details
export async function updateBoothOrder(orderId: number, updates: any, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('booth_orders').update(updates).eq('id', orderId);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { success: true };
}

// 6. Delete Order
export async function deleteBoothOrder(orderId: number, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('booth_orders').delete().eq('id', orderId);
  if (error) return { error: error.message };
  revalidatePath(path);
  return { success: true };
}