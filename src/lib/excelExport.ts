// lib/excelExport.ts - Full updated file
import { Booking, ServicePackage, TeamMember, FinancialEntry, PhotographerFinancialDetail, ProductOrder, OrderedItem, ProductOrderFinancialEntry } from './types';

export interface MonthlyReportData {
  bookings: Booking[];
  packages: ServicePackage[];
  teamMembers: TeamMember[];
  productOrders: ProductOrder[];
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

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  analyzedBookings: number;
}

export async function generateMonthlyExcelReport(data: MonthlyReportData): Promise<Blob> {
  const { bookings, packages, month, year, productOrders } = data;
  
  // Calculate analytics
  const packageStats = calculatePackageStats(bookings, packages);
  const staffStats = calculateStaffStats(bookings, packages);
  const categoryStats = calculateCategoryStats(bookings);
  const totalIncome = calculateTotalIncome(bookings, packages);
  const financialStats = calculateFinancialStats(bookings);

  // Create Excel workbook structure
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateBookingDetailsSheet(bookings, packages)), 
    'Booking Details'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateProductOrdersSheet(productOrders)), 
    'Product Orders'
  );
  // NEW: Add Product Financials sheet
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateProductFinancialsSheet(productOrders)), 
    'Product Financials'
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
    XLSX.utils.aoa_to_sheet(generateFinancialBreakdownSheet(bookings)), 
    'Financial Breakdown'
  );
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generatePhotographerEarningsSheet(bookings)), 
    'Photographer Earnings'
  );
  // --- ADD THIS LINE ---
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.aoa_to_sheet(generateSalarySheet(bookings, productOrders)), 
    'Salary Sheet'
  );
  // --- END OF ADDITION ---

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

function calculateFinancialStats(bookings: Booking[]): FinancialStats {
  const bookingsWithFinancial = bookings.filter(b => b.financial_entry);
  
  const totalRevenue = bookingsWithFinancial.reduce((sum, booking) => 
    sum + (booking.financial_entry!.package_amount || 0), 0);
  
  const totalExpenses = bookingsWithFinancial.reduce((sum, booking) => {
    const financial = booking.financial_entry!;
    return sum + 
      (financial.photographer_expenses || 0) +
      (financial.videographer_expenses || 0) +
      (financial.editor_expenses || 0) +
      (financial.company_expenses || 0) +
      (financial.other_expenses || 0);
  }, 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    analyzedBookings: bookingsWithFinancial.length
  };
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

// Generate Photographer Earnings Sheet (without Average Per Event column)
function generatePhotographerEarningsSheet(bookings: Booking[]): (string | number)[][] {
  const headers = [
    'Staff Member', 
    'Total Events', 
    'Total Earnings',
    'Assigned Bookings (Inquiry IDs)'
  ];
  
  // Calculate photographer earnings across all bookings
  const photographerEarnings: { [key: string]: { 
    events: number; 
    totalEarnings: number; 
    bookings: string[] 
  } } = {};

  bookings.forEach(booking => {
    if (booking.financial_entry?.photographer_details) {
      booking.financial_entry.photographer_details.forEach(detail => {
        if (!photographerEarnings[detail.staff_name]) {
          photographerEarnings[detail.staff_name] = {
            events: 0,
            totalEarnings: 0,
            bookings: []
          };
        }
        
        photographerEarnings[detail.staff_name].events += 1;
        photographerEarnings[detail.staff_name].totalEarnings += detail.amount;
        if (booking.inquiry_id) {
          photographerEarnings[detail.staff_name].bookings.push(booking.inquiry_id);
        }
      });
    }
  });

  // If no photographer details found, show message
  if (Object.keys(photographerEarnings).length === 0) {
    return [
      ['Photographer Earnings'],
      [''],
      ['No photographer financial data available for this period.'],
      ['Financial details need to be entered in the Financial Dialog for each booking.']
    ];
  }

  const data = Object.entries(photographerEarnings)
    .map(([staffName, stats]) => [
      staffName,
      stats.events,
      `Rs. ${stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      stats.bookings.join(', ')
    ])
    .sort((a, b) => {
      // Sort by total earnings descending
      const earningsA = parseFloat((a[2] as string).replace(/[^\d.]/g, ''));
      const earningsB = parseFloat((b[2] as string).replace(/[^\d.]/g, ''));
      return earningsB - earningsA;
    });

  // Add summary row
  const totalEvents = Object.values(photographerEarnings).reduce((sum, stats) => sum + stats.events, 0);
  const totalEarnings = Object.values(photographerEarnings).reduce((sum, stats) => sum + stats.totalEarnings, 0);

  data.push(
    [''],
    ['SUMMARY', 
     totalEvents, 
     `Rs. ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
     `Total Photographers: ${Object.keys(photographerEarnings).length}`
    ]
  );

  return [headers, ...data];
}

// Financial Breakdown Sheet (without Net Profit and Profit Margin columns)
function generateFinancialBreakdownSheet(bookings: Booking[]): (string | number)[][] {
  const headers = [
    'Inquiry ID', 'Client Name', 'Package Category', 'Package Name', 
    'Package Amount', 'Photographer Expenses', 'Videographer Expenses', 
    'Editor Expenses', 'Company Expenses', 'Other Expenses', 'Total Expenses'
  ];
  
  const bookingsWithFinancial = bookings.filter(booking => booking.financial_entry);
  
  // If no financial entries, show message
  if (bookingsWithFinancial.length === 0) {
    return [
      ['Financial Breakdown'],
      [''],
      ['No financial data available for this period.'],
      ['Financial details need to be entered in the Financial Dialog for each booking.']
    ];
  }

  const data = bookingsWithFinancial.map(booking => {
    const financial = booking.financial_entry!;
    const totalExpenses = 
      (financial.photographer_expenses || 0) +
      (financial.videographer_expenses || 0) +
      (financial.editor_expenses || 0) +
      (financial.company_expenses || 0) +
      (financial.other_expenses || 0);

    return [
      booking.inquiry_id || 'N/A',
      booking.full_name,
      financial.package_category || 'N/A',
      financial.package_name || 'N/A',
      financial.package_amount ? `Rs. ${financial.package_amount.toLocaleString()}` : 'Rs. 0',
      financial.photographer_expenses ? `Rs. ${financial.photographer_expenses.toLocaleString()}` : 'Rs. 0',
      financial.videographer_expenses ? `Rs. ${financial.videographer_expenses.toLocaleString()}` : 'Rs. 0',
      financial.editor_expenses ? `Rs. ${financial.editor_expenses.toLocaleString()}` : 'Rs. 0',
      financial.company_expenses ? `Rs. ${financial.company_expenses.toLocaleString()}` : 'Rs. 0',
      financial.other_expenses ? `Rs. ${financial.other_expenses.toLocaleString()}` : 'Rs. 0',
      `Rs. ${totalExpenses.toLocaleString()}`
    ];
  });

  // Add summary row
  const financialStats = calculateFinancialStats(bookings);
  data.push(
    [''],
    ['SUMMARY', '', '', '', 
     `Rs. ${financialStats.totalRevenue.toLocaleString()}`, 
     '', '', '', '', '',
     `Rs. ${financialStats.totalExpenses.toLocaleString()}`
    ]
  );

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

// Financial Summary Sheet (removed booking count, total revenue, total expenses, net profit, profit margin rows)
function generateFinancialSummarySheet(totalIncome: number, month: string, year: string): (string | number)[][] {
  const sheets = [
    ['Monthly Financial Summary'],
    [''],
    ['Report Period:', `${getMonthName(parseInt(month))} ${year}`],
    ['Total Estimated Revenue:', `Rs. ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ];

  sheets.push(
    [''],
    ['Generated on:', new Date().toLocaleDateString()],
    ['Generated by:', 'Studio Management System']
  );

  return sheets;
}

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
}

// Generate Product Orders Sheet
function generateProductOrdersSheet(productOrders: ProductOrder[]): (string | number)[][] {
  const headers = [
    'Order ID', 'Order Date', 'Customer Name', 'Customer Email', 'Customer Mobile', 
    'Order Status', 'Item Type', 'Item Details', 'Quantity', 'Item Price', 'Line Total', 'Order Total'
  ];
  
  if (!productOrders || productOrders.length === 0) {
    return [
      ['Product Orders'],
      [''],
      ['No product orders found for this period.']
    ];
  }

  const data: (string | number)[][] = [];
  let grandTotal = 0;

  productOrders.forEach(order => {
    grandTotal += order.total_amount;
    
    if (order.ordered_items && order.ordered_items.length > 0) {
      order.ordered_items.forEach((item, index) => {
        // Format item details
        let details = `${item.size}`;
        if (item.type === 'frame' && item.material) details += `, ${item.material}`;
        if (item.type === 'print' && item.paper_type) details += `, ${item.paper_type}`;
        if (item.type === 'album') details += `, ${item.cover_type}, ${item.page_count} Pages`;

        data.push([
          // Order info (only on the first item row for clarity)
          index === 0 ? order.order_id : '',
          index === 0 ? new Date(order.created_at).toLocaleDateString() : '',
          index === 0 ? order.customer_name : '',
          index === 0 ? order.customer_email : '',
          index === 0 ? order.customer_mobile || 'N/A' : '',
          index === 0 ? order.status || 'Pending' : '',
          
          // Item info
          item.type,
          details,
          item.quantity,
          `Rs. ${item.price.toLocaleString()}`,
          `Rs. ${item.line_total.toLocaleString()}`,
          
          // Order total (only on the first item row)
          index === 0 ? `Rs. ${order.total_amount.toLocaleString()}` : '',
        ]);
      });
    } else {
      // Order with no items? (Shouldn't happen, but good to handle)
      data.push([
        order.order_id,
        new Date(order.created_at).toLocaleDateString(),
        order.customer_name,
        order.customer_email,
        order.customer_mobile || 'N/A',
        order.status || 'Pending',
        'No items found',
        '',
        0,
        'Rs. 0',
        'Rs. 0',
        `Rs. ${order.total_amount.toLocaleString()}`,
      ]);
    }
  });

  // Add summary row
  data.push(
    [''],
    [
      'SUMMARY', '', '', '', '', '', '', '', '', '', 
      'Total Revenue:', 
      `Rs. ${grandTotal.toLocaleString()}`
    ]
  );

  return [headers, ...data];
}

// --- NEW: generateProductFinancialsSheet function ---
function generateProductFinancialsSheet(productOrders: ProductOrder[]): (string | number)[][] {
  const headers = [
    'Order ID', 'Customer Name', 'Studio', 'Order Amount', 
    'Photographer Commission', 'Studio Fee', 'Other Expenses', 'Profit',
    'Assigned Staff', 'Staff 1', 'Amount 1', 'Staff 2', 'Amount 2'
  ];
  
  const ordersWithFinancial = productOrders.filter(order => order.financial_entry);
  
  if (ordersWithFinancial.length === 0) {
    return [
      ['Product Order Financials'],
      [''],
      ['No financial data available for product orders in this period.'],
      ['Financial details must be entered in the Financial Dialog for each order.']
    ];
  }

  const data = ordersWithFinancial.map(order => {
    const financial = order.financial_entry!;
    const staff = financial.photographer_details || [];
    
    return [
      order.order_id,
      order.customer_name,
      order.studio_slug,
      `Rs. ${financial.order_amount?.toLocaleString() || 0}`,
      `Rs. ${financial.photographer_commission_total?.toLocaleString() || 0}`,
      `Rs. ${financial.studio_fee?.toLocaleString() || 0}`,
      `Rs. ${financial.other_expenses?.toLocaleString() || 0}`,
      `Rs. ${financial.profit?.toLocaleString() || 0}`,
      order.assigned_photographers?.join(', ') || 'N/A',
      staff[0]?.staff_name || '',
      staff[0]?.amount ? `Rs. ${staff[0].amount.toLocaleString()}` : '',
      staff[1]?.staff_name || '',
      staff[1]?.amount ? `Rs. ${staff[1].amount.toLocaleString()}` : '',
    ];
  });

  // Add summary row
  const totalAmount = ordersWithFinancial.reduce((sum, o) => sum + (o.financial_entry?.order_amount || 0), 0);
  const totalCommission = ordersWithFinancial.reduce((sum, o) => sum + (o.financial_entry?.photographer_commission_total || 0), 0);
  const totalStudioFee = ordersWithFinancial.reduce((sum, o) => sum + (o.financial_entry?.studio_fee || 0), 0);
  const totalOther = ordersWithFinancial.reduce((sum, o) => sum + (o.financial_entry?.other_expenses || 0), 0);
  const totalProfit = ordersWithFinancial.reduce((sum, o) => sum + (o.financial_entry?.profit || 0), 0);

  data.push(
    [''],
    [
      'SUMMARY', '', '',
      `Rs. ${totalAmount.toLocaleString()}`,
      `Rs. ${totalCommission.toLocaleString()}`,
      `Rs. ${totalStudioFee.toLocaleString()}`,
      `Rs. ${totalOther.toLocaleString()}`,
      `Rs. ${totalProfit.toLocaleString()}`,
      '', '', '', ''
    ]
  );

  return [headers, ...data];
}

// --- NEW: generateSalarySheet function ---
function generateSalarySheet(bookings: Booking[], productOrders: ProductOrder[]): (string | number)[][] {
  const headers = [
    'Staff Member', 
    'Booking Earnings', 
    'Product Commission', 
    'Total Earnings'
  ];
  
  const salaryData: { 
    [staffName: string]: { 
      bookingEarnings: number; 
      productEarnings: number; 
      totalEarnings: number; 
    } 
  } = {};

  // 1. Calculate earnings from Bookings
  bookings.forEach(booking => {
    if (booking.financial_entry?.photographer_details) {
      booking.financial_entry.photographer_details.forEach(detail => {
        const staffName = detail.staff_name;
        if (!salaryData[staffName]) {
          salaryData[staffName] = { bookingEarnings: 0, productEarnings: 0, totalEarnings: 0 };
        }
        salaryData[staffName].bookingEarnings += detail.amount;
        salaryData[staffName].totalEarnings += detail.amount;
      });
    }
  });

  // 2. Calculate earnings from Product Orders
  productOrders.forEach(order => {
    if (order.financial_entry?.photographer_details) {
      order.financial_entry.photographer_details.forEach(detail => {
        const staffName = detail.staff_name;
        if (!salaryData[staffName]) {
          salaryData[staffName] = { bookingEarnings: 0, productEarnings: 0, totalEarnings: 0 };
        }
        salaryData[staffName].productEarnings += detail.amount;
        salaryData[staffName].totalEarnings += detail.amount;
      });
    }
  });

  // If no data, return a message
  if (Object.keys(salaryData).length === 0) {
    return [
      ['Salary Sheet'],
      [''],
      ['No earnings data found for any staff member in this period.']
    ];
  }

  // Convert to array and format for Excel
  const data = Object.entries(salaryData)
    .map(([staffName, totals]) => [
      staffName,
      `Rs. ${totals.bookingEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${totals.productEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${totals.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])
    .sort((a, b) => {
      // Sort by total earnings (column 3) descending
      const earningsA = parseFloat((a[3] as string).replace(/[^\d.]/g, ''));
      const earningsB = parseFloat((b[3] as string).replace(/[^\d.]/g, ''));
      return earningsB - earningsA;
    });

  // Add summary row
  const totalBookings = Object.values(salaryData).reduce((sum, d) => sum + d.bookingEarnings, 0);
  const totalProducts = Object.values(salaryData).reduce((sum, d) => sum + d.productEarnings, 0);
  const totalOverall = Object.values(salaryData).reduce((sum, d) => sum + d.totalEarnings, 0);
  
  data.push(
    [''],
    [
      'SUMMARY', 
      `Rs. ${totalBookings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${totalProducts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${totalOverall.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]
  );

  return [headers, ...data];
}