import { notFound } from "next/navigation";
import { supabase } from "./supabaseClient";
import { Studio, PortfolioItem, TeamMember } from "./types"; // 👈 Import the TeamMember type

// --- getStudioData function (existing) ---
export async function getStudioData(studioId: string): Promise<Studio> {
  const { data: studio, error } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioId)
    .single();

  if (error || !studio) {
    notFound();
  }
  return studio as Studio;
}

// --- getPortfolioItems function (existing) ---
export async function getPortfolioItems(studioId: string) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("studio_slug", studioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching portfolio items:", error);
    return [];
  }
  return data as PortfolioItem[];
}

// --- NEW getTeamMembers function ---
export async function getTeamMembers() {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("is_management", { ascending: false }) // Show management first
    .order("id"); // Then order by ID

  if (error) {
    console.error("Error fetching team members:", error);
    return []; // Return empty array on error
  }
  return data as TeamMember[];
}
// --- END NEW function ---