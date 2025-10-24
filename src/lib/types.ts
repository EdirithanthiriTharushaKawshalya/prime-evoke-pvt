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
  inquiry_id: string | null;
};