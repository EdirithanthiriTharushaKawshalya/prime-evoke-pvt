"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  TrendingUp,
  Users,
  Camera,
  DollarSign,
  LucideIcon,
  ChevronRight,
  X,
  Menu,
  Smartphone,
} from "lucide-react";
import { getAnalyticsData } from "@/lib/actions";

// Modern Gradient Palette
const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
];

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
  products: number;
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
        {label && (
          <p className="text-zinc-400 text-[10px] mb-2 uppercase tracking-wider font-bold">
            {label}
          </p>
        )}
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-zinc-300 font-medium flex-1">
              {entry.name}
            </span>
            <span className="text-xs text-white font-bold">
              {entry.name === "Revenue" || entry.dataKey === "revenue"
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

// Custom Pie Chart Tooltip
const PieChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md min-w-[150px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="text-sm font-bold text-white">{data.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-zinc-400">Events:</span>
            <span className="text-xs font-bold text-white">
              {data.value.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-zinc-400">Share:</span>
            <span className="text-xs font-bold text-white">
              {((data.percent || 0) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(data.percent || 0) * 100}%`,
                  backgroundColor: payload[0].color,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// View All Categories Modal Component
const ViewAllCategoriesModal = ({ 
  categories, 
  onClose 
}: { 
  categories: Array<{
    name: string;
    value: number;
    percent: number;
    color: string;
    rank: number;
  }>;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white">All Event Categories</h3>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Detailed breakdown of all photography event types
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {categories.map((category) => (
              <div
                key={category.rank}
                className="p-3 md:p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="max-w-[120px] md:max-w-none">
                      <h4 className="font-bold text-white text-sm md:text-base truncate">{category.name}</h4>
                      <span className="text-xs text-zinc-500">
                        Rank #{category.rank}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base md:text-lg font-bold text-white">
                      {category.value}
                    </div>
                    <div className="text-xs text-zinc-400">events</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-zinc-400">Share</span>
                    <span className="font-bold text-white">
                      {(category.percent * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 md:h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${category.percent * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] md:text-xs text-zinc-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="text-center p-1 md:p-2 bg-white/5 rounded">
                      <div className="text-zinc-400">Percentage</div>
                      <div className="font-bold text-white">
                        {(category.percent * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-1 md:p-2 bg-white/5 rounded">
                      <div className="text-zinc-400">Of Total</div>
                      <div className="font-bold text-white">
                        {category.value}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-center min-w-[100px]">
                <div className="text-xs md:text-sm text-zinc-400">Total Categories</div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {categories.length}
                </div>
              </div>
              <div className="text-center min-w-[100px]">
                <div className="text-xs md:text-sm text-zinc-400">Total Events</div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {categories.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()}
                </div>
              </div>
              <div className="text-center min-w-[100px]">
                <div className="text-xs md:text-sm text-zinc-400">Avg per Category</div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {Math.round(categories.reduce((sum, cat) => sum + cat.value, 0) / categories.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 md:py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors text-sm md:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsDashboard({ userRole }: { userRole: string }) {
  const [range, setRange] = useState<"3m" | "6m" | "1y" | "all">("6m");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
    null
  );
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Calculate percentages for enhanced pie chart
  const pieDataWithPercent = useMemo(() => {
    if (!data) return [];
    const total =
      data.totals.bookings ||
      data.categoryData.reduce((sum, item) => sum + item.value, 0);
    return data.categoryData
      .map((item, index) => ({
        ...item,
        percent: item.value / total,
        color: COLORS[index % COLORS.length],
        rank: index + 1,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Get top 3 categories for side panel
  const topCategories = useMemo(() => {
    return pieDataWithPercent.slice(0, isMobile ? 2 : 3);
  }, [pieDataWithPercent, isMobile]);

  // Get all other categories (excluding top 3)
  const otherCategories = useMemo(() => {
    return pieDataWithPercent.slice(isMobile ? 2 : 3);
  }, [pieDataWithPercent, isMobile]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-8 text-center text-muted-foreground">
        No data available
      </div>
    );

  return (
    <>
      <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6 md:pb-10">
        {/* Mobile Header Indicator */}
        {isMobile && (
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 bg-zinc-900/50 py-2 rounded-lg">
            <Smartphone className="h-3 w-3" />
            <span>Mobile View</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <h2 className="text-base md:text-xl font-semibold text-white">
              Performance Overview
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Track your studio&apos;s growth and metrics
            </p>
          </div>
          <Select
            value={range}
            onValueChange={(val) => setRange(val as "3m" | "6m" | "1y" | "all")}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10 hover:bg-white/10 transition-colors text-sm">
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
        {userRole === "management" && (
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Revenue"
              value={`Rs. ${data.totals.revenue.toLocaleString()}`}
              icon={DollarSign}
              color="text-emerald-400"
            />
            <SummaryCard
              title="Total Events"
              value={data.totals.bookings}
              icon={Camera}
              color="text-blue-400"
            />
            <SummaryCard
              title="Rentals"
              value={data.totals.rentals}
              icon={TrendingUp}
              color="text-purple-400"
            />
            <SummaryCard
              title="Product Orders"
              value={data.totals.orders}
              icon={Users}
              color="text-amber-400"
            />
          </div>
        )}

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-full md:max-w-[400px] bg-white/5 p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-zinc-800 text-xs md:text-sm"
            >
              Company Growth
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="rounded-lg data-[state=active]:bg-zinc-800 text-xs md:text-sm"
            >
              Staff Performance
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: COMPANY GROWTH --- */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
              {/* Main Bar Chart - Full width on mobile, 4 cols on desktop */}
              <Card className="col-span-1 lg:col-span-4 bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-sm md:text-lg">
                    Monthly Activity
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Volume of events, rentals, and orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6 md:pl-2">
                  <div className="h-[250px] md:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data.chartData} 
                        barGap={isMobile ? 2 : 4}
                        margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 5 } : undefined}
                      >
                        <defs>
                          <linearGradient
                            id="colorEvents"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3b82f6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorRentals"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#a855f7"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#a855f7"
                              stopOpacity={0.3}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#71717a"
                          fontSize={isMobile ? 10 : 12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={isMobile ? 10 : 12}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                        />
                        {!isMobile && (
                          <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                          />
                        )}
                        <Bar
                          dataKey="bookings"
                          name="Events"
                          fill="url(#colorEvents)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={isMobile ? 20 : 40}
                        />
                        <Bar
                          dataKey="rentals"
                          name="Rentals"
                          fill="url(#colorRentals)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={isMobile ? 20 : 40}
                        />
                        <Bar
                          dataKey="orders"
                          name="Orders"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={isMobile ? 20 : 40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Event Types Pie Chart - Responsive layout */}
              <Card className="col-span-1 lg:col-span-3 bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm md:text-lg">
                        Event Types
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        Distribution of photography categories
                      </CardDescription>
                    </div>
                    <div className="text-xs md:text-sm text-zinc-400">
                      <span className="font-bold text-white">
                        {data.totals.bookings}
                      </span>{" "}
                      Total Events
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} gap-4 md:gap-6`}>
                    {/* Pie Chart Container */}
                    <div className={`${isMobile ? 'w-full' : 'lg:w-1/2'} h-[200px] md:h-[250px] relative`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDataWithPercent}
                            cx="50%"
                            cy="50%"
                            innerRadius={isMobile ? 40 : 60}
                            outerRadius={isMobile ? 70 : 90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={1}
                            onMouseEnter={(data, index) =>
                              setActiveCategoryIndex(index)
                            }
                            onMouseLeave={() => setActiveCategoryIndex(null)}
                            activeShape={(props: any) => {
                              const {
                                cx,
                                cy,
                                innerRadius,
                                outerRadius,
                                startAngle,
                                endAngle,
                                fill,
                              } = props;
                              return (
                                <g>
                                  <path
                                    d={`M ${cx} ${cy}
              L ${cx + outerRadius * Math.cos((-startAngle * Math.PI) / 180)} ${
                                      cy +
                                      outerRadius *
                                        Math.sin((-startAngle * Math.PI) / 180)
                                    }
              A ${outerRadius} ${outerRadius} 0 ${
                                      endAngle - startAngle > 180 ? 1 : 0
                                    } 0 ${
                                      cx +
                                      outerRadius *
                                        Math.cos((-endAngle * Math.PI) / 180)
                                    } ${
                                      cy +
                                      outerRadius *
                                        Math.sin((-endAngle * Math.PI) / 180)
                                    }
              L ${cx} ${cy}`}
                                    fill={fill}
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth={2}
                                  />
                                  <path
                                    d={`M ${cx} ${cy}
              L ${cx + innerRadius * Math.cos((-startAngle * Math.PI) / 180)} ${
                                      cy +
                                      innerRadius *
                                        Math.sin((-startAngle * Math.PI) / 180)
                                    }
              A ${innerRadius} ${innerRadius} 0 ${
                                      endAngle - startAngle > 180 ? 1 : 0
                                    } 0 ${
                                      cx +
                                      innerRadius *
                                        Math.cos((-endAngle * Math.PI) / 180)
                                    } ${
                                      cy +
                                      innerRadius *
                                        Math.sin((-endAngle * Math.PI) / 180)
                                    }
              L ${cx} ${cy}`}
                                    fill="rgba(0,0,0,0.2)"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth={1}
                                  />
                                </g>
                              );
                            }}
                          >
                            {pieDataWithPercent.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="transition-all duration-300 hover:opacity-90"
                                strokeWidth={
                                  activeCategoryIndex === index ? 2 : 0
                                }
                                stroke="rgba(255,255,255,0.5)"
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<PieChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Stats */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <div className="text-xl md:text-3xl font-bold text-white leading-none">
                          {activeCategoryIndex !== null
                            ? pieDataWithPercent[
                                activeCategoryIndex
                              ]?.value.toLocaleString()
                            : data.totals.bookings.toLocaleString()}
                        </div>
                        <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-widest font-medium mt-1">
                          {activeCategoryIndex !== null
                            ? pieDataWithPercent[activeCategoryIndex]?.name
                            : "Total Events"}
                        </div>
                        {activeCategoryIndex !== null && (
                          <div className="text-[10px] md:text-xs text-zinc-400 mt-1">
                            {(
                              (pieDataWithPercent[activeCategoryIndex]
                                ?.percent || 0) * 100
                            ).toFixed(1)}
                            %
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legend/Details Panel */}
                    <div className={isMobile ? 'w-full' : 'lg:w-1/2'}>
                      <div className="mb-4">
                        <h3 className="text-xs md:text-sm font-semibold text-zinc-400 mb-2 md:mb-3">
                          Top Categories
                        </h3>
                        <div className="space-y-2 md:space-y-3">
                          {topCategories.map((category, index) => (
                            <div
                              key={index}
                              className={`p-2 md:p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                                activeCategoryIndex === index
                                  ? "border-white/20 bg-white/5"
                                  : "border-white/5 hover:border-white/10 hover:bg-white/5"
                              }`}
                              onMouseEnter={() => setActiveCategoryIndex(index)}
                              onMouseLeave={() => setActiveCategoryIndex(null)}
                              onClick={() =>
                                setActiveCategoryIndex(
                                  index === activeCategoryIndex ? null : index
                                )
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <div
                                    className="w-2 h-2 md:w-3 md:h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <div className="max-w-[80px] md:max-w-[100px]">
                                    <p className="text-xs md:text-sm font-medium text-white truncate">
                                      {category.name}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-zinc-500">
                                      #{category.rank}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs md:text-sm font-bold text-white">
                                    {category.value}
                                  </p>
                                  <p className="text-[10px] md:text-xs text-zinc-500">
                                    {((category.percent || 0) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-1 md:mt-2">
                                <div className="flex justify-between text-[8px] md:text-[10px] text-zinc-500 mb-1">
                                  <span>0%</span>
                                  <span>100%</span>
                                </div>
                                <div className="w-full h-1 md:h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${(category.percent || 0) * 100}%`,
                                      backgroundColor: category.color,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          <div className="text-center p-1 md:p-2 bg-white/5 rounded-lg">
                            <div className="text-[10px] md:text-xs text-zinc-400">
                              Categories
                            </div>
                            <div className="text-sm md:text-lg font-bold text-white">
                              {pieDataWithPercent.length}
                            </div>
                          </div>
                          <div className="text-center p-1 md:p-2 bg-white/5 rounded-lg">
                            <div className="text-[10px] md:text-xs text-zinc-400">Avg/Type</div>
                            <div className="text-sm md:text-lg font-bold text-white">
                              {Math.round(
                                data.totals.bookings / pieDataWithPercent.length
                              )}
                            </div>
                          </div>
                        </div>

                        {/* View All Link */}
                        <div className="mt-3 md:mt-4 flex items-center justify-between text-xs md:text-sm">
                          <span className="text-zinc-400 text-[10px] md:text-xs">
                            {otherCategories.length} more categories
                          </span>
                          <button 
                            onClick={() => setShowAllCategories(true)}
                            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-[10px] md:text-xs"
                          >
                            View All
                            <ChevronRight className="h-2 w-2 md:h-3 md:w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Line Chart */}
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-sm md:text-lg">
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Financial growth over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-6 md:pl-2">
                <div className="h-[250px] md:h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={data.chartData}
                      margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 5 } : undefined}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#71717a"
                        fontSize={isMobile ? 10 : 12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={isMobile ? 10 : 12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rs ${value / 1000}k`}
                        dx={-10}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                          stroke: "rgba(255,255,255,0.2)",
                          strokeWidth: 1,
                          strokeDasharray: "4 4",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={isMobile ? 2 : 3}
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
          <TabsContent value="staff" className="mt-4 md:mt-6">
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-sm md:text-lg">
                  Staff Productivity
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Comparison of tasks completed by each team member
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <div className="h-[350px] md:h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.staffPerformance}
                      layout="vertical"
                      margin={isMobile ? 
                        { left: -10, right: 10, bottom: 10, top: 10 } : 
                        { left: 0, right: 30, bottom: 20 }
                      }
                      barGap={2}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        type="number"
                        stroke="#71717a"
                        fontSize={isMobile ? 10 : 12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#fff"
                        width={isMobile ? 80 : 120}
                        tick={{ fontSize: isMobile ? 10 : 13, fill: "#e4e4e7" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      />
                      {!isMobile && (
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ paddingTop: "10px" }}
                          iconType="circle"
                        />
                      )}
                      <Bar
                        dataKey="events"
                        name="Events Covered"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        barSize={isMobile ? 8 : 12}
                        background={{ fill: "rgba(255,255,255,0.02)" }}
                      />
                      <Bar
                        dataKey="edits"
                        name="Edits Completed"
                        fill="#ec4899"
                        radius={[0, 4, 4, 0]}
                        barSize={isMobile ? 8 : 12}
                      />
                      <Bar
                        dataKey="products"
                        name="Products Sold"
                        fill="#f59e0b"
                        radius={[0, 4, 4, 0]}
                        barSize={isMobile ? 8 : 12}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View All Categories Modal */}
      {showAllCategories && (
        <ViewAllCategoriesModal
          categories={pieDataWithPercent}
          onClose={() => setShowAllCategories(false)}
        />
      )}
    </>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <Card className="bg-zinc-900/60 border-white/5 backdrop-blur-md shadow-lg hover:bg-zinc-900/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-wide truncate">
          {title}
        </CardTitle>
        <div
          className={`p-1 md:p-2 rounded-lg bg-white/5 ${color
            .replace("text-", "bg-")
            .replace("400", "500/10")} flex-shrink-0`}
        >
          <Icon className={`h-3 w-3 md:h-4 md:w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div
          className="text-lg md:text-2xl font-bold text-white truncate tracking-tight"
          title={String(value)}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}