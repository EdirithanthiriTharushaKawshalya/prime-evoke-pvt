// lib/booth-auth.ts
"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// 1. Verify PIN and Set Session
export async function verifyBoothPin(eventId: number, code: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Fetch the real codes from DB
  const { data: event } = await supabase
    .from('booth_events')
    .select('admin_code, client_code')
    .eq('id', eventId)
    .single();

  if (!event) return { error: "Event not found" };

  // Check Code
  if (code === event.admin_code) {
    // Set Admin Cookie
    (await cookies()).set(`booth_access_${eventId}`, 'admin', { httpOnly: true, path: '/' });
    return { success: true, role: 'admin' };
  } 
  
  if (code === event.client_code) {
    // Set Client Cookie
    (await cookies()).set(`booth_access_${eventId}`, 'client', { httpOnly: true, path: '/' });
    return { success: true, role: 'client' };
  }

  return { error: "Invalid Access Code" };
}

// 2. Get Current Access Level (Server Side Helper)
export async function getBoothAccess(eventId: number) {
  const cookieStore = await cookies();
  const cookieName = `booth_access_${eventId}`;
  const value = cookieStore.get(cookieName)?.value;

  if (value === 'admin') return 'admin';
  if (value === 'client') return 'client';
  return null; // No access
}

// 3. Logout Action
export async function logoutBooth(eventId: number) {
  (await cookies()).delete(`booth_access_${eventId}`);
}