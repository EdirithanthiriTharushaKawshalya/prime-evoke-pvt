// lib/excelExport.ts
import { Booking, ServicePackage, TeamMember } from './types';

export interface MonthlyReportData {
  bookings: Booking[];
  packages: ServicePackage[];
  teamMembers: TeamMember[];
  month: string;
  year: string;
}

export async function generateMonthlyExcelReport(data: MonthlyReportData): Promise<Blob> {
  const { bookings, packages, teamMembers, month, year } = data;
  
  // Calculate analytics
  const packageStats = calculatePackageStats(bookings, packages);
  const staffStats = calculateStaffStats(bookings, teamMembers);
  const categoryStats = calculateCategoryStats(bookings);
  const totalIncome = calculateTotalIncome(bookings, packages);

  // Create Excel workbook structure
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateBookingDetailsSheet(bookings, packages, teamMembers)), 
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

  // Convert to Excel blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// Analytics calculation functions
function calculatePackageStats(bookings: Booking[], packages: ServicePackage[]) {
  const stats: { [packageName: string]: { count: number; revenue: number } } = {};
  
  packages.forEach(pkg => {
    const packageBookings = bookings.filter(booking => 
      booking.package_name === pkg.name
    );
    
    stats[pkg.name || 'Unknown'] = {
      count: packageBookings.length,
      revenue: packageBookings.reduce((sum, booking) => {
        const price = parseFloat(pkg.price?.replace(/[^\d.]/g, '') || '0');
        return sum + price;
      }, 0)
    };
  });
  
  return stats;
}

function calculateStaffStats(bookings: Booking[], teamMembers: TeamMember[]) {
  const stats: { [staffName: string]: { count: number; assignments: string[] } } = {};
  
  teamMembers.forEach(member => {
    const staffBookings = bookings.filter(booking =>
      booking.assigned_photographers?.includes(member.name)
    );
    
    stats[member.name] = {
      count: staffBookings.length,
      assignments: staffBookings.map(b => b.inquiry_id || 'Unknown')
    };
  });
  
  // Add unassigned bookings
  const unassignedBookings = bookings.filter(booking => 
    !booking.assigned_photographers || booking.assigned_photographers.length === 0
  );
  
  stats['Unassigned'] = {
    count: unassignedBookings.length,
    assignments: unassignedBookings.map(b => b.inquiry_id || 'Unknown')
  };
  
  return stats;
}

function calculateCategoryStats(bookings: Booking[]) {
  const stats: { [category: string]: number } = {};
  
  bookings.forEach(booking => {
    const category = booking.event_type || 'Uncategorized';
    stats[category] = (stats[category] || 0) + 1;
  });
  
  return stats;
}

function calculateTotalIncome(bookings: Booking[], packages: ServicePackage[]) {
  return bookings.reduce((total, booking) => {
    const pkg = packages.find(p => p.name === booking.package_name);
    const price = parseFloat(pkg?.price?.replace(/[^\d.]/g, '') || '0');
    return total + price;
  }, 0);
}

// Sheet generation functions
function generateBookingDetailsSheet(bookings: Booking[], packages: ServicePackage[], teamMembers: TeamMember[]) {
  const headers = [
    'Inquiry ID', 'Client Name', 'Email', 'Event Type', 'Package', 
    'Event Date', 'Status', 'Assigned Staff', 'Package Price', 'Contact Date'
  ];
  
  const data = bookings.map(booking => {
    const pkg = packages.find(p => p.name === booking.package_name);
    const assignedStaff = booking.assigned_photographers?.join(', ') || 'Unassigned';
    
    return [
      booking.inquiry_id || 'N/A',
      booking.full_name,
      booking.email,
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

function generatePackageAnalyticsSheet(packageStats: any) {
  const headers = ['Package Name', 'Booking Count', 'Total Revenue'];
  const data = Object.entries(packageStats).map(([pkgName, stats]: [string, any]) => [
    pkgName,
    stats.count,
    `$${stats.revenue.toFixed(2)}`
  ]);
  
  return [headers, ...data];
}

function generateStaffPerformanceSheet(staffStats: any) {
  const headers = ['Staff Member', 'Assigned Bookings', 'Assignment IDs'];
  const data = Object.entries(staffStats).map(([staffName, stats]: [string, any]) => [
    staffName,
    stats.count,
    stats.assignments.join(', ')
  ]);
  
  return [headers, ...data];
}

function generateCategoryBreakdownSheet(categoryStats: any) {
  const headers = ['Event Category', 'Booking Count'];
  const data = Object.entries(categoryStats).map(([category, count]) => [
    category,
    count
  ]);
  
  return [headers, ...data];
}

function generateFinancialSummarySheet(totalIncome: number, month: string, year: string) {
  return [
    ['Monthly Financial Summary'],
    [''],
    ['Report Period:', `${getMonthName(parseInt(month))} ${year}`],
    ['Total Bookings:', totalIncome > 0 ? 'See Analytics Sheets' : '0'],
    ['Total Estimated Revenue:', `$${totalIncome.toFixed(2)}`],
    [''],
    ['Generated on:', new Date().toLocaleDateString()],
    ['Generated by:', 'Studio Management System']
  ];
}

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}