"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Users, Camera, DollarSign, LucideIcon } from "lucide-react";
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
        // Safely cast the result to our expected type
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

  if (!data) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls: Stack vertically on small mobile, row on larger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg md:text-xl font-semibold text-white">Performance Overview</h2>
        <Select value={range} onValueChange={(val: '3m' | '6m' | '1y' | 'all') => setRange(val)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10">
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

      {/* Summary Cards: 1 col mobile -> 2 cols tablet -> 4 cols desktop */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            
            {/* Main Bar Chart (Revenue & Events) - Spans 4 cols on desktop */}
            <Card className="col-span-1 lg:col-span-4 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Monthly Activity</CardTitle>
                <CardDescription>Comparison of Bookings vs Rentals vs Orders</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 md:pl-2">
                <div className="h-[300px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="bookings" name="Events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rentals" name="Rentals" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart (Event Categories) - Spans 3 cols on desktop */}
            <Card className="col-span-1 lg:col-span-3 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Event Types</CardTitle>
                <CardDescription>Distribution of photography categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => 
                          `${name ?? "Unknown"} ${percent !== undefined ? (percent * 100).toFixed(0) : "0"}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.categoryData.map((entry: CategoryDataPoint, index: number) => (
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
              <CardTitle className="text-base md:text-lg">Revenue Trend</CardTitle>
              <CardDescription>Total income over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 md:pl-2">
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `Rs ${value/1000}k`} 
                    />
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
              <CardTitle className="text-base md:text-lg">Staff Productivity</CardTitle>
              <CardDescription>Events covered and Edits completed by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] md:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.staffPerformance} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="#888888" />
                    <YAxis dataKey="name" type="category" stroke="#fff" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
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
        <div className="text-xl md:text-2xl font-bold text-white truncate" title={String(value)}>{value}</div>
      </CardContent>
    </Card>
  );
}