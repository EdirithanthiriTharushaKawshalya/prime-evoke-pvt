"use client"; // This component needs client-side interactivity

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Use the client-side Supabase instance
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react"; // Optional icon
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed", { description: error.message });
    } else {
      // Redirect to login page after successful logout
      router.push("/login");
      // Optional: Refresh to ensure server state is cleared if needed
      // router.refresh();
      toast.success("Logged out successfully");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" /> {/* Optional icon */}
      Logout
    </Button>
  );
}