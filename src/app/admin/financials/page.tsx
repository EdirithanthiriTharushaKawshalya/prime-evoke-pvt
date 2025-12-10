// app/admin/financials/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CreditCard, User } from "lucide-react";
import Link from "next/link";
import { FinancialRecord } from "@/lib/types";
import { AddFinancialDialog } from "@/components/ui/AddFinancialDialog";
import { EditFinancialDialog } from "@/components/ui/EditFinancialDialog";
import { DeleteFinancialButton } from "@/components/ui/DeleteFinancialButton";
import { Badge } from "@/components/ui/badge";

export default async function FinancialsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  
  const userRole = profileData?.role || 'staff';

  // 1. Fetch Staff Members for the dropdown (New)
  const { data: staffData } = await supabase
    .from("team_members")
    .select("id, name")
    .order("name");
  
  const staffMembers = staffData || [];

  // 2. Fetch Financial Records (Include joined staff name)
  const { data: records } = await supabase
    .from("other_financial_records")
    .select("*, staff_member:team_members(name)") // <--- Join staff name
    .order("date", { ascending: false });

  const financials = (records as unknown as FinancialRecord[]) || [];

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      <div className="container mx-auto py-6 px-4 md:py-10">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Financial Records</h1>
          </div>
          
          {userRole === 'management' && (
            <div className="w-full sm:w-auto">
                {/* Pass staffMembers to the Add Dialog */}
                <AddFinancialDialog staffMembers={staffMembers} />
            </div>
          )}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-6 border-b border-white/10">
            <CardTitle className="text-lg sm:text-xl">Income & Expenses Ledger</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            
            {/* --- 1. MOBILE VIEW (Cards) --- */}
            <div className="block md:hidden p-4 space-y-4">
              {financials.map((record) => (
                <div key={record.id} className="bg-background/40 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
                  
                  {/* Top Row: Date & Amount */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <span className={`text-lg font-bold ${
                      record.type === 'Income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {record.type === 'Income' ? '+' : '-'} Rs. {record.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Middle Row: Description */}
                  <div>
                    <p className="font-medium text-base">{record.description}</p>
                    {/* Show Paid To if exists */}
                    {record.staff_id && (record as any).staff_member && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>Paid to: {(record as any).staff_member.name}</span>
                        </div>
                    )}
                  </div>

                  {/* Bottom Row: Badges & Payment */}
                  <div className="flex flex-wrap gap-2 items-center justify-between mt-1">
                    <div className="flex gap-2">
                        <Badge variant="secondary" className={`text-xs ${
                          record.type === 'Income' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {record.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {record.payment_method}
                        </Badge>
                    </div>

                    {/* Edit/Delete for Management */}
                    {userRole === 'management' && (
                      <div className="flex gap-1">
                        {/* Pass staffMembers to Edit Dialog */}
                        <EditFinancialDialog record={record} staffMembers={staffMembers} />
                        <DeleteFinancialButton recordId={record.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {financials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No records found.
                </div>
              )}
            </div>

            {/* --- 2. DESKTOP VIEW (Table) --- */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-white/10">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned Staff</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {userRole === 'management' && <TableHead className="text-right w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financials.map((record) => (
                    <TableRow key={record.id} className="border-b border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[300px]" title={record.description}>
                            {record.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal ${
                          record.type === 'Income' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'
                        }`}>
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(record as any).staff_member?.name ? (
                            <Badge variant="secondary" className="text-[10px]">{(record as any).staff_member.name}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.payment_method}</TableCell>
                      <TableCell className={`text-right font-bold ${
                          record.type === 'Income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {record.type === 'Income' ? '+' : '-'} Rs. {record.amount.toLocaleString()}
                      </TableCell>
                      
                      {userRole === 'management' && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Pass staffMembers to Edit Dialog */}
                            <EditFinancialDialog record={record} staffMembers={staffMembers} />
                            <DeleteFinancialButton recordId={record.id} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {financials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={userRole === 'management' ? 7 : 6} className="text-center py-12 text-muted-foreground">
                        No records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}