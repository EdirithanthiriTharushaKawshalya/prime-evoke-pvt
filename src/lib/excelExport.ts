// lib/excelExport.ts
import { Booking, ServicePackage, TeamMember } from './types';

export interface MonthlyReportData {
  bookings: Booking[];
  packages: ServicePackage[];
  teamMembers: TeamMember[];
  month: string;
  year: string;
}

interface PackageStats {
  [packageName: string]: { count: number; revenue: number };
}

interface StaffStats {
  [staffName: string]: { 
    count: number; 
    assignments: string[];
    revenue: number;
  };
}

interface CategoryStats {
  [category: string]: number;
}

export async function generateMonthlyExcelReport(data: MonthlyReportData): Promise<Blob> {
  const { bookings, packages, month, year } = data;
  
  // Calculate analytics
  const packageStats = calculatePackageStats(bookings, packages);
  const staffStats = calculateStaffStats(bookings, packages);
  const categoryStats = calculateCategoryStats(bookings);
  const totalIncome = calculateTotalIncome(bookings, packages);

  // Create Excel workbook structure
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateBookingDetailsSheet(bookings, packages)), 
    'Booking Details'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generatePackageAnalyticsSheet(packageStats)), 
    'Package Analytics'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateStaffPerformanceSheet(staffStats)), 
    'Staff Performance'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateCategoryBreakdownSheet(categoryStats)), 
    'Category Breakdown'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateFinancialSummarySheet(totalIncome, month, year)), 
    'Financial Summary'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateStaffRevenueSheet(staffStats)), 
    'Staff Revenue'
  );

  // Convert to Excel blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// Analytics calculation functions
function calculatePackageStats(bookings: Booking[], packages: ServicePackage[]): PackageStats {
  const stats: PackageStats = {};
  
  packages.forEach(pkg => {
    const packageBookings = bookings.filter(booking => 
      booking.package_name === pkg.name
    );
    
    stats[pkg.name || 'Unknown'] = {
      count: packageBookings.length,
      revenue: packageBookings.reduce((sum) => {
        // Extract numeric value from price string (e.g., "Rs. 250000" -> 250000)
        const priceText = pkg.price || '0';
        const priceMatch = priceText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const priceValue = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        return sum + priceValue;
      }, 0)
    };
  });
  
  return stats;
}

function calculateStaffStats(bookings: Booking[], packages: ServicePackage[]): StaffStats {
  const stats: StaffStats = {};
  
  // Process assigned staff from bookings
  bookings.forEach(booking => {
    const assignedStaff = booking.assigned_photographers || [];
    const pkg = packages.find(p => p.name === booking.package_name);
    
    // Calculate revenue for this booking
    const priceText = pkg?.price || '0';
    const priceMatch = priceText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const bookingRevenue = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
    
    // Distribute revenue equally among assigned staff
    const revenuePerStaff = assignedStaff.length > 0 ? bookingRevenue / assignedStaff.length : 0;
    
    assignedStaff.forEach(staffName => {
      if (!stats[staffName]) {
        stats[staffName] = {
          count: 0,
          assignments: [],
          revenue: 0
        };
      }
      stats[staffName].count += 1;
      stats[staffName].assignments.push(booking.inquiry_id || 'Unknown');
      stats[staffName].revenue += revenuePerStaff;
    });
  });
  
  // Add unassigned bookings
  const unassignedBookings = bookings.filter(booking => 
    !booking.assigned_photographers || booking.assigned_photographers.length === 0
  );
  
  if (unassignedBookings.length > 0) {
    stats['Unassigned'] = {
      count: unassignedBookings.length,
      assignments: unassignedBookings.map(b => b.inquiry_id || 'Unknown'),
      revenue: 0
    };
  }
  
  return stats;
}

function calculateCategoryStats(bookings: Booking[]): CategoryStats {
  const stats: CategoryStats = {};
  
  bookings.forEach(booking => {
    const category = booking.event_type || 'Uncategorized';
    stats[category] = (stats[category] || 0) + 1;
  });
  
  return stats;
}

function calculateTotalIncome(bookings: Booking[], packages: ServicePackage[]): number {
  return bookings.reduce((total, booking) => {
    const pkg = packages.find(p => p.name === booking.package_name);
    const priceText = pkg?.price || '0';
    const priceMatch = priceText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
    return total + price;
  }, 0);
}

// Update the booking details sheet
function generateBookingDetailsSheet(bookings: Booking[], packages: ServicePackage[]): (string | number)[][] {
  const headers = [
    'Inquiry ID', 'Client Name', 'Email', 'Mobile Number', 'Studio', 'Event Type', 'Package', 
    'Event Date', 'Status', 'Assigned Staff', 'Package Price', 'Contact Date'
  ];
  
  const data = bookings.map(booking => {
    const pkg = packages.find(p => p.name === booking.package_name);
    const assignedStaff = booking.assigned_photographers?.join(', ') || 'Unassigned';
    const studioName = booking.studio_slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return [
      booking.inquiry_id || 'N/A',
      booking.full_name,
      booking.email,
      booking.mobile_number || 'N/A',
      studioName,
      booking.event_type || 'N/A',
      booking.package_name || 'N/A',
      booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A',
      booking.status || 'N/A',
      assignedStaff,
      pkg?.price || 'N/A',
      new Date(booking.created_at).toLocaleDateString()
    ];
  });
  
  return [headers, ...data];
}

function generatePackageAnalyticsSheet(packageStats: PackageStats): (string | number)[][] {
  const headers = ['Package Name', 'Booking Count', 'Total Revenue'];
  const data = Object.entries(packageStats)
    .filter(([_, stats]) => stats.count > 0) // Only show packages with bookings
    .map(([pkgName, stats]) => [
      pkgName,
      stats.count,
      `Rs. ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
  
  return [headers, ...data];
}

function generateStaffPerformanceSheet(staffStats: StaffStats): (string | number)[][] {
  const headers = ['Staff Member', 'Assigned Bookings', 'Assignment IDs'];
  const data = Object.entries(staffStats).map(([staffName, stats]) => [
    staffName,
    stats.count,
    stats.assignments.join(', ')
  ]);
  
  return [headers, ...data];
}

function generateStaffRevenueSheet(staffStats: StaffStats): (string | number)[][] {
  const headers = ['Staff Member', 'Events Worked', 'Total Revenue Contribution', 'Average Revenue Per Event'];
  
  const data = Object.entries(staffStats)
    .filter(([staffName]) => staffName !== 'Unassigned') // Exclude unassigned from revenue calculations
    .map(([staffName, stats]) => [
      staffName,
      stats.count,
      `Rs. ${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      stats.count > 0 ? `Rs. ${(stats.revenue / stats.count).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Rs. 0.00'
    ])
    .sort((a, b) => (b[2] as string).localeCompare(a[2] as string)); // Sort by revenue descending
  
  return [headers, ...data];
}

function generateCategoryBreakdownSheet(categoryStats: CategoryStats): (string | number)[][] {
  const headers = ['Event Category', 'Booking Count'];
  const data = Object.entries(categoryStats).map(([category, count]) => [
    category,
    count
  ]);
  
  return [headers, ...data];
}

function generateFinancialSummarySheet(totalIncome: number, month: string, year: string): (string | number)[][] {
  return [
    ['Monthly Financial Summary'],
    [''],
    ['Report Period:', `${getMonthName(parseInt(month))} ${year}`],
    ['Total Bookings:', totalIncome > 0 ? 'See Analytics Sheets' : '0'],
    ['Total Estimated Revenue:', `Rs. ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    [''],
    ['Generated on:', new Date().toLocaleDateString()],
    ['Generated by:', 'Studio Management System']
  ];
}

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}