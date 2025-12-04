// This type defines the shape of a statistic
export type Stat = {
  value: string;
  label: string;
};

// This is the new, updated shape of your Studio data
export type Studio = {
  id: number;
  created_at: string;
  slug: string;
  name: string;
  hero_title: string | null;
  hero_subtitle: string | null; // This is the "eyebrow" text
  about_text: string | null;
  photographer_image_url: string | null;
  hero_description: string | null;
  hero_image_url: string | null;
  stats: Stat[] | null;
  facebook_url: string | null;
  logo_url: string | null;
  why_choose_us: WhyChooseUsPoint[] | null;
};

// This is the shape of your ServicePackage data
export type ServicePackage = {
  id: number;
  created_at: string;
  name: string | null;
  price: string | null;
  description: string | null;
  features: string[] | null;
  studio_name: string | null;
  category: string | null;
};

// Add this new type
export type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  studio_slug: string;
  facebook_post_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  publicImageUrl?: string;
};

// Define the shape of a single 'Why Choose Us' point
export type WhyChooseUsPoint = {
  title: string;
  description: string;
};

// --- FIX: Add the TeamMember type definition ---
export type TeamMember = {
  id: number;
  created_at: string;
  name: string;
  position: string;
  is_management: boolean | null;
  primary_employment: string | null;
  degrees: string[] | null; // Array of strings
  bio: string | null;
  image_url: string | null;
  linkedin_url: string | null;
};

// --- Add or Verify this Profile type ---
export type Profile = {
  id: string; // This should match the UUID from auth.users
  updated_at: string | null;
  full_name: string | null;
  role: string; // Should be 'management' or 'worker'
};

// types.ts - Make sure FinancialEntry has all required fields
export type FinancialEntry = {
  id: number;
  created_at: string;
  booking_id: number;
  package_category: string | null;
  package_name: string | null;
  package_amount: number | null;
  photographer_expenses: number | null;
  videographer_expenses: number | null;
  editor_expenses: number | null;
  editor_name: string | null; // <--- NEW
  company_expenses: number | null;
  other_expenses: number | null;
  final_amount: number | null;
  photographer_details?: PhotographerFinancialDetail[];
};

// Update Booking type to include financial_entry
export type Booking = {
  id: number;
  created_at: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  event_type: string | null;
  package_name: string | null;
  event_date: string | null;
  message: string | null;
  studio_slug: string;
  status: string | null;
  assigned_photographers: string[] | null;
  assigned_editor: string | null; // <--- NEW
  inquiry_id: string | null;
  financial_entry?: FinancialEntry | null;
};

// types.ts - Add new type
export type PhotographerFinancialDetail = {
  id: number;
  created_at: string;
  booking_id: number;
  staff_name: string;
  amount: number;
};

// --- NEW Product Types ---

export type Frame = {
  id: number;
  size: string;
  material: string | null;
  price: number;
  description: string | null;
  image_url: string | null;
};

export type PrintSize = {
  id: number;
  size: string;
  paper_type: string;
  price: number;
};

export type Album = {
  id: number;
  size: string;
  page_count: number;
  cover_type: string;
  price: number;
  description: string | null;
};

// --- NEW Order Types ---

export type OrderedItem = {
  type: "frame" | "print" | "album";
  id: number; // ID of the specific frame/print/album
  size: string;
  material?: string | null; // For frames
  paper_type?: string; // For prints
  cover_type?: string; // For albums
  page_count?: number; // For albums
  quantity: number;
  price: number; // Price per item at time of order
  line_total: number; // quantity * price
};

export type ProductOrderPhotographerCommission = {
  id: number;
  created_at: string;
  order_id: number;
  staff_name: string;
  amount: number;
};

export type ProductOrderFinancialEntry = {
  id: number;
  created_at: string;
  order_id: number;
  order_amount: number | null;
  photographer_commission_total: number | null;
  studio_fee: number | null;
  other_expenses: number | null;
  profit: number | null;
  photographer_details?: ProductOrderPhotographerCommission[];
};

// --- UPDATE ProductOrder Type ---

export type ProductOrder = {
  id: number;
  created_at: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string | null;
  ordered_items: OrderedItem[] | null; // Array of ordered items
  total_amount: number;
  status: string | null;
  studio_slug: string; // <-- ADDED
  assigned_photographers: string[] | null; // <-- ADDED
  financial_entry?: ProductOrderFinancialEntry | null; // <-- ADDED
};

// --- NEW Financial Record Type ---
export type FinancialRecord = {
  id: number;
  created_at: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  payment_method: string | null;
};

// --- NEW Stock Item Type ---
export type StockItem = {
  id: number;
  created_at: string;
  item_name: string;
  category: string; // 'Frame', 'Paper', 'Other'
  quantity: number;
  unit_price: number;
  reorder_level: number;
  last_updated: string;
};

export type RentalEquipment = {
  id: number;
  created_at: string;
  name: string;
  category: string; 
  description: string | null;
  daily_rate: number;
  quantity_total: number;
  image_url: string | null;
  is_active: boolean;
  store_location: string; // <--- ADD THIS LINE
};

export type RentalBooking = {
  id: number;
  created_at: string;
  booking_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';
  total_amount: number;
  notes: string | null;
  items?: RentalOrderItem[]; 
  verification_status?: 'pending' | 'verified' | 'rejected';
  store_id: string; 
};

export type RentalOrderItem = {
  id: number;
  equipment_name: string;
  quantity: number;
  days_rented: number;
  daily_rate_snapshot: number;
};