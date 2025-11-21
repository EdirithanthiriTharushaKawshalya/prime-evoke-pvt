// actions.ts - Full updated file
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
  StockItem 
} from '@/lib/types';

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

    // --- NEW: Process Product Orders with Financials ---
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
      productOrders: productOrdersWithFinancial || [], // Pass ENHANCED product orders
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

// --- updateFinancialEntry function ---
export async function updateFinancialEntry(
  bookingId: number,
  financialData: {
    package_category?: string;
    package_name?: string;
    package_amount?: number;
    photographer_expenses?: number;
    videographer_expenses?: number;
    editor_expenses?: number;
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
      const { error: insertError } = await supabase
        .from('photographer_financial_details')
        .insert(detailsToInsert.map(detail => ({
          booking_id: bookingId,
          staff_name: detail.staff_name,
          amount: detail.amount
        })));

      if (insertError) {
        console.error("Error inserting photographer details:", insertError);
        return { error: insertError.message };
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

// --- NEW: updateProductOrderAssignments function ---
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

// --- NEW: updateProductOrderFinancialEntry function ---
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

// --- NEW: updateProductOrderPhotographerCommission function ---
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
    // 1. Delete existing details for this order
    const { error: deleteError } = await supabase
      .from('product_order_photographer_commission')
      .delete()
      .eq('order_id', orderId);

    if (deleteError) throw deleteError;

    // 2. Insert new details (only those with amount > 0)
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
    studio_slug: string; // <-- ADDED
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

    // Generate a unique Order ID
    const generateOrderId = (): string => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ORD-${timestamp}-${random}`.toUpperCase();
    };

    const orderId = generateOrderId();

    try {
        const { data, error } = await supabase
            .from('product_orders')
            .insert([{
                order_id: orderId,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_mobile: formData.customer_mobile,
                ordered_items: formData.ordered_items,
                total_amount: formData.total_amount,
                status: 'New',
                studio_slug: formData.studio_slug, // <-- ADDED
                assigned_photographers: [], // <-- ADDED (initialize as empty)
            }])
            .select('id, order_id')
            .single();

        if (error) throw error;

        revalidatePath('/admin/bookings');
        return { success: true, orderId: data?.order_id };

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

// --- NEW: updateProductOrder function ---
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

// --- NEW: generateMySalaryReport function ---
export async function generateMySalaryReport(month: string, year: string) {
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

  // Security Check: Get the logged-in user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { error: "Not authenticated. Please log in." };
  }

  // Get the user's full name from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.full_name) {
    return { error: "Could not find your user profile. Please update your profile name." };
  }

  const userName = profile.full_name;

  try {
    // 1. Calculate date range for the selected month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    // 2. Fetch booking earnings for this user *within the date range*
    // We must do an inner join and filter on the booking's event_date
    const { data: bookingEarnings, error: bError } = await supabase
      .from('photographer_financial_details')
      .select('*, booking:client_bookings!inner(inquiry_id, event_date)')
      .eq('staff_name', userName)
      .gte('booking.event_date', startDate.split('T')[0]) // Filter on joined table
      .lte('booking.event_date', endDate.split('T')[0]);  // Filter on joined table

    if (bError) throw bError;

    // 3. Fetch product commission earnings for this user *within the date range*
    // We must do an inner join and filter on the order's created_at
    const { data: productEarnings, error: pError } = await supabase
      .from('product_order_photographer_commission')
      .select('*, order:product_orders!inner(order_id, created_at)')
      .eq('staff_name', userName)
      .gte('order.created_at', startDate) // Filter on joined table
      .lte('order.created_at', endDate);  // Filter on joined table

    if (pError) throw pError;

    if (bookingEarnings?.length === 0 && productEarnings?.length === 0) {
      return { error: `No earnings data found for your profile for ${month}/${year}.` };
    }

    // 4. Import and use the Excel generator
    const { generateUserSalaryReport } = await import('@/lib/excelExport');
    const excelBlob = await generateUserSalaryReport({
      bookingEarnings: bookingEarnings || [],
      productEarnings: productEarnings || [],
      userName: userName,
      month: month, // Pass month and year
      year: year
    });

    // 5. Convert blob to base64 for response
    const buffer = await excelBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return { 
      success: true, 
      data: base64,
      fileName: `Salary-Report-${userName.replace(' ', '-')}-${month}-${year}.xlsx`
    };

  } catch (error: unknown) {
    console.error("Error generating user salary report:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: `Failed to generate report: ${message}` };
  }
}

// --- FINANCIAL RECORDS ACTIONS ---

export async function addFinancialRecord(data: Omit<FinancialRecord, 'id' | 'created_at'>) {
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
    return { error: "Permission denied. Only management can add financial records." };
  }

  const { error } = await supabase.from('other_financial_records').insert([data]);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/financials');
  return { success: true };
}

export async function deleteFinancialRecord(id: number) {
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
    return { error: "Permission denied. Only management can delete financial records." };
  }

  const { error } = await supabase.from('other_financial_records').delete().eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/financials');
  return { success: true };
}

// --- STOCK ACTIONS ---

export async function addStockItem(data: Omit<StockItem, 'id' | 'created_at' | 'last_updated'>) {
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
    return { error: "Permission denied. Only management can add stock items." };
  }

  const { error } = await supabase.from('inventory_stock').insert([data]);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/stock');
  return { success: true };
}

export async function updateStockQuantity(id: number, newQuantity: number) {
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
    return { error: "Permission denied. Only management can update stock." };
  }

  const { error } = await supabase
    .from('inventory_stock')
    .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
    .eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/stock');
  return { success: true };
}

export async function deleteStockItem(id: number) {
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
    return { error: "Permission denied. Only management can delete stock items." };
  }

  const { error } = await supabase.from('inventory_stock').delete().eq('id', id);
  
  if (error) return { error: error.message };
  revalidatePath('/admin/stock');
  return { success: true };
}