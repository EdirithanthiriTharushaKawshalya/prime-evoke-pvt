"use server";

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// --- updateBookingAssignments function ---
export async function updateBookingAssignments(
  bookingId: number,
  newAssignments: string[]
) {
  // Await cookies() because it's a Promise in Next.js 15
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

// --- NEW: updateBookingStatus function ---
export async function updateBookingStatus(bookingId: number, newStatus: string) {
  // Await cookies() because it's a Promise in Next.js 15
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
