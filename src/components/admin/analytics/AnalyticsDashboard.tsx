"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Users, Camera, DollarSign, LucideIcon } from "lucide-react"; // Import LucideIcon type
import { getAnalyticsData } from "@/lib/actions";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// --- Types ---
interface MonthlyDataPoint {
  name: string;
  fullDate: string;
  bookings: number;
  rentals: number;
  orders: number;
  revenue: number;
}

interface StaffPerformanceData {
  name: string;
  events: number;
  edits: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface AnalyticsData {
  chartData: MonthlyDataPoint[];
  staffPerformance: StaffPerformanceData[];
  categoryData: CategoryDataPoint[];
  totals: {
    bookings: number;
    rentals: number;
    orders: number;
    revenue: number;
  };
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAnalyticsData(range);
        // Ensure result matches the expected structure or handle accordingly
        // For now assuming getAnalyticsData returns compatible data
        setData(result as unknown as AnalyticsData); 
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Performance Overview</h2>
        <Select value={range} onValueChange={(val: '3m' | '6m' | '1y' | 'all') => setRange(val)}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10">
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Revenue" value={`Rs. ${data.totals.revenue.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
        <SummaryCard title="Total Events" value={data.totals.bookings} icon={Camera} color="text-blue-400" />
        <SummaryCard title="Rentals" value={data.totals.rentals} icon={TrendingUp} color="text-purple-400" />
        <SummaryCard title="Product Orders" value={data.totals.orders} icon={Users} color="text-amber-400" />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-white/5">
          <TabsTrigger value="overview">Company Growth</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: COMPANY GROWTH --- */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* Main Bar Chart (Revenue & Events) */}
            <Card className="col-span-4 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
                <CardDescription>Comparison of Bookings vs Rentals vs Orders</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="bookings" name="Events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rentals" name="Rentals" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart (Event Categories) */}
            <Card className="col-span-3 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
                <CardDescription>Distribution of photography categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Line Chart */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Total income over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value/1000}k`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: STAFF PERFORMANCE --- */}
        <TabsContent value="staff" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle>Staff Productivity</CardTitle>
              <CardDescription>Events covered and Edits completed by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.staffPerformance} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#888888" />
                    <YAxis dataKey="name" type="category" stroke="#fff" width={100} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Legend />
                    <Bar dataKey="events" name="Events Covered" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="edits" name="Edits Completed" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}