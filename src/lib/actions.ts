"use server"; // Mark this file as Server Actions

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // To refresh the page data after update

export async function updateBookingAssignments(bookingId: number, newAssignments: string[]) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options) }, // Simplified for Server Action context
        remove(name: string, options: CookieOptions) { cookieStore.set(name, '', options) },
      },
    }
  );

  // Check if user is authenticated and has management role (important security check)
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) return { error: "Not authenticated" };

   const { data: profile } = await supabase
       .from('profiles')
       .select('role')
       .eq('id', session.user.id)
       .single();

   if (profile?.role !== 'management') {
       return { error: "Permission denied. Only management can assign photographers." };
   }

  // Perform the update
  const { error } = await supabase
    .from('client_bookings')
    .update({ assigned_photographers: newAssignments })
    .eq('id', bookingId);

  if (error) {
    console.error("Server Action Error updating assignments:", error);
    return { error: error.message };
  }

  // Revalidate the path to update the UI
  revalidatePath('/admin/bookings');
  return { success: true };
}