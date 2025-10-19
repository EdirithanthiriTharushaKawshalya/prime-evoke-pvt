import { notFound } from "next/navigation";
import { supabase } from "./supabaseClient";
import { PortfolioItem, Studio } from "./types"; // 👈 Import the new Studio type

export async function getStudioData(studioId: string): Promise<Studio> {
  const { data: studio, error } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioId)
    .single();

  if (error || !studio) {
    notFound();
  }

  return studio as Studio; // 👈 Tell TypeScript this data is a Studio
}

// Add this new function
export async function getPortfolioItems(studioId: string) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("studio_slug", studioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching portfolio items:", error);
    return []; // Return an empty array on error
  }
  return data as PortfolioItem[];
}