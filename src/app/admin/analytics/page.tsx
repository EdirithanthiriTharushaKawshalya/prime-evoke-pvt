// app/admin/analytics/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnalyticsDashboard from "@/components/admin/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Fetch Profile to determine Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  // Default to 'staff' if role is missing
  const userRole = profile?.role || 'staff';

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-4 px-4 md:py-10 flex-1">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-bold leading-tight">Analytics & Progress</h1>
            <p className="text-sm text-muted-foreground">Financial insights and team performance metrics</p>
          </div>
        </div>

        {/* Pass userRole to the Dashboard Component */}
        <AnalyticsDashboard userRole={userRole} />

      </div>
      <Footer />
    </div>
  );
}