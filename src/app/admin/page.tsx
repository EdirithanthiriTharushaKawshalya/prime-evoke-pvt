// app/admin/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, DollarSign, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { Profile } from "@/lib/types"; // Import Profile type

export default async function AdminHub() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name) => cookieStore.get(name)?.value },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // --- NEW: Fetch Profile to check Role ---
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();

  const profile = profileData as Profile | null;
  const userRole = profile?.role ?? "staff";
  const userName = profile?.full_name || session.user.email || "Unknown User";

  // Define menu items with a 'restricted' flag
  const allMenuItems = [
    {
      title: "Bookings & Orders",
      description: "Manage client photography sessions and product orders.",
      icon: CalendarDays,
      href: "/admin/bookings",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      restricted: false, // Everyone can see
    },
    {
      title: "Financial Records",
      description: "Track general income, expenses, and other company transactions.",
      icon: DollarSign,
      href: "/admin/financials",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      restricted: true, // ONLY Management
    },
    {
      title: "Stock Inventory",
      description: "Manage stocks for printing papers, frames, and other materials.",
      icon: Package,
      href: "/admin/stock",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      restricted: false, // Everyone can see
    },
  ];

  // Filter items: Show all if management, otherwise filter out restricted ones
  const menuItems = allMenuItems.filter(item => 
    userRole === 'management' || !item.restricted
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-8 px-4 flex-1 flex flex-col">
        
        {/* Logout Button */}
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Overview</h1>
            <p className="text-muted-foreground text-lg">Select a module to manage</p>
            
            {/* --- NEW: Moved "Viewing As" label here --- */}
            <p className="mt-4 text-sm text-muted-foreground">
              Viewing as: <span className="font-medium text-foreground">{userRole}</span> ({userName})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full mb-12">
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href} className="group">
                <Card className="h-full border-white/10 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-4`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-6">
                      {item.description}
                    </CardDescription>
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Access Module <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}