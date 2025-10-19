import { notFound } from "next/navigation";
import { supabase } from "./supabaseClient";
import { Studio } from "./types"; // 👈 Import the new Studio type

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