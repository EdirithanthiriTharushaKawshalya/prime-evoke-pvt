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