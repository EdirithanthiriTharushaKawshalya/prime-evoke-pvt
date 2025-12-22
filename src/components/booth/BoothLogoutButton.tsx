"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutBooth } from "@/lib/booth-auth";
import { useRouter } from "next/navigation";

export function BoothLogoutButton({ eventId }: { eventId: number }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutBooth(eventId);
    router.refresh(); // This triggers the layout to re-check cookies and show Login Form
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleLogout}
      className="text-muted-foreground hover:text-white"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Exit
    </Button>
  );
}