"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Users, Camera, DollarSign, LucideIcon } from "lucide-react";
import { getAnalyticsData } from "@/lib/actions";

// Modern Gradient Palette
const COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ec4899'];

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

interface TooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color: string;
    dataKey?: string;
  }[];
  label?: string;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[150px]">
        {label && <p className="text-zinc-400 text-[10px] mb-2 uppercase tracking-wider font-bold">{label}</p>}
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-300 font-medium flex-1">{entry.name}</span>
            <span className="text-xs text-white font-bold">
              {entry.name === 'Revenue' || entry.dataKey === 'revenue' 
                ? `Rs. ${entry.value.toLocaleString()}` 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Legend for Pie Chart - Updated UI
const CustomPieLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-col gap-3 justify-center h-full pl-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center justify-between text-sm w-full">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
             <span className="text-zinc-300 font-medium text-xs truncate max-w-[120px]" title={entry.value}>
               {entry.payload.name}
             </span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-white font-bold text-xs">{entry.value}</span>
             <span className="text-zinc-500 text-[10px] font-mono opacity-70 min-w-[30px] text-right">
               {((entry.payload.percent || 0) * 100).toFixed(0)}%
             </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default function AnalyticsDashboard({ userRole }: { userRole: string }) {
  const [range, setRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getAnalyticsData(range);
        setData(result as unknown as AnalyticsData); 
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);

  // Calculate percentages for custom legend
  const pieDataWithPercent = useMemo(() => {
    if (!data) return [];
    const total = data.categoryData.reduce((sum, item) => sum + item.value, 0);
    return data.categoryData.map(item => ({
      ...item,
      percent: item.value / total
    }));
  }, [data]);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return <div className="p-8 text-center text-muted-foreground">No data available</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">Performance Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">Track your studio&apos;s growth and metrics</p>
        </div>
        <Select value={range} onValueChange={(val) => setRange(val as '3m' | '6m' | '1y' | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
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

      {/* Summary Cards - ONLY VISIBLE TO MANAGEMENT */}
      {userRole === 'management' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Total Revenue" value={`Rs. ${data.totals.revenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
          <SummaryCard title="Total Events" value={data.totals.bookings} icon={Camera} color="text-blue-400" />
          <SummaryCard title="Rentals" value={data.totals.rentals} icon={TrendingUp} color="text-purple-400" />
          <SummaryCard title="Product Orders" value={data.totals.orders} icon={Users} color="text-amber-400" />
        </div>
      )}

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-white/5 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-zinc-800">Company Growth</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-zinc-800">Staff Performance</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: COMPANY GROWTH --- */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            
            {/* Main Bar Chart - Spans 4 cols */}
            <Card className="col-span-1 lg:col-span-4 bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Monthly Activity</CardTitle>
                <CardDescription>Volume of events, rentals, and orders</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 md:pl-2">
                <div className="h-[300px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} barGap={4}>
                      <defs>
                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                      <Bar dataKey="bookings" name="Events" fill="url(#colorEvents)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="rentals" name="Rentals" fill="url(#colorRentals)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* UPDATED PIE CHART - Spans 3 cols */}
            <Card className="col-span-1 lg:col-span-3 bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl flex flex-col">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Event Types</CardTitle>
                <CardDescription>Distribution of photography categories</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                <div className="h-full w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataWithPercent}
                        cx="35%" // Shifted left to make room for legend
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieDataWithPercent.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        content={<CustomPieLegend />}
                        wrapperStyle={{ right: 0, top: '50%', transform: 'translateY(-50%)', width: '50%' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute left-[18%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-3xl font-bold text-white block leading-none">{data.totals.bookings}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Line Chart */}
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Revenue Trend</CardTitle>
              <CardDescription>Financial growth over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 md:pl-2">
              <div className="h-[300px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `Rs ${value/1000}k`} 
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: STAFF PERFORMANCE --- */}
        <TabsContent value="staff" className="mt-6">
          <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Staff Productivity</CardTitle>
              <CardDescription>Comparison of tasks completed by each team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.staffPerformance} 
                    layout="vertical" 
                    margin={{ left: 0, right: 30 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#fff" 
                      width={120} 
                      tick={{ fontSize: 13, fill: '#e4e4e7' }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    
                    <Bar 
                      dataKey="events" 
                      name="Events Covered" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]} 
                      barSize={12}
                      background={{ fill: 'rgba(255,255,255,0.02)' }}
                    />
                    <Bar 
                      dataKey="edits" 
                      name="Edits Completed" 
                      fill="#ec4899" 
                      radius={[0, 4, 4, 0]} 
                      barSize={12} 
                    />
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
    <Card className="bg-zinc-900/60 border-white/5 backdrop-blur-md shadow-lg hover:bg-zinc-900/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wide">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-white/5 ${color.replace('text-', 'bg-').replace('400', '500/10')}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white truncate tracking-tight" title={String(value)}>{value}</div>
      </CardContent>
    </Card>
  );
}