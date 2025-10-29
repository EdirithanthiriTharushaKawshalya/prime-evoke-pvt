// src/app/[studioId]/services/page.tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@supabase/ssr"; // Use server client for data fetching
import { cookies } from "next/headers";
import Link from "next/link";
import { Check, Frame as FrameIcon, Printer, BookOpen } from "lucide-react"; // Added product icons
import { ServicePackage, Frame, PrintSize, Album } from "@/lib/types"; // Import product types
import { getStudioData } from "@/lib/data";

export const revalidate = 300; // Re-fetch data every 300 seconds (5 minutes)

// Helper function to categorize service packages
function categorizeServices(packages: ServicePackage[]) {
  const categorized: { [key: string]: ServicePackage[] } = {};
  for (const pkg of packages) {
    if (pkg.category) {
      if (!categorized[pkg.category]) {
        categorized[pkg.category] = [];
      }
      categorized[pkg.category].push(pkg);
    }
  }
  // Return sorted categories
  return Object.entries(categorized).sort((a, b) => a[0].localeCompare(b[0]));
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-LK')}`; // Sri Lankan Rupee format
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const studioData = await getStudioData(studioId);
  const cookieStore = cookies(); // Needed for server client

  // Create Supabase client for server-side fetching
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
      },
    }
  );

  // --- Fetch ALL Data Concurrently ---
  const [
    servicesResult,
    framesResult,
    printsResult,
    albumsResult
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("studio_name", studioData.name)
      .order("category").order("id"),
    supabase.from("frames").select("*").order("id"),
    supabase.from("print_sizes").select("*").order("id"),
    supabase.from("albums").select("*").order("id")
  ]);

  // --- Process Service Packages ---
  const packages: ServicePackage[] = servicesResult.data || [];
  if (servicesResult.error) {
    console.error("Error fetching services:", servicesResult.error);
    // Consider returning an error message, but continue to show products
  }
  const categorizedPackages = categorizeServices(packages);
  const serviceCategories = categorizedPackages.map(([category]) => category);

  // --- Process Products ---
  const frames: Frame[] = framesResult.data || [];
  const printSizes: PrintSize[] = printsResult.data || [];
  const albums: Album[] = albumsResult.data || [];
  const productCategories = ["Frames", "Prints", "Albums"]; // Define product tab names

  // Combine all categories for tabs
  const allCategories = [...serviceCategories, ...productCategories];
  // Determine default tab (first service category or first product category)
  const defaultTab = serviceCategories[0] || productCategories[0];

  // Handle case where there might be no packages or products
  if (allCategories.length === 0) {
    return (
      <div
        className="container mx-auto py-12 md:py-24 px-4 text-center"
        data-aos="fade-up" // Animate empty state too
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          {studioData.name} Services & Products
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          No packages or products available at this time. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 md:py-24 px-4">
      {/* Page Header */}
      <section className="text-center mb-12 md:mb-16" data-aos="fade-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          {studioData.name} Services & Products
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Explore our packages and product offerings.
        </p>
      </section>

      {/* --- Tabbed Interface --- */}
      <section data-aos="fade-up" data-aos-delay="100">
        <Tabs defaultValue={defaultTab} className="w-full">
          {/* Tabs List - dynamically create tabs for all categories */}
          <div className="flex justify-center mb-8">
            {/* Adjust max-width and grid-cols based on total number of tabs */}
            <TabsList className="grid w-full max-w-4xl grid-cols-3 md:grid-cols-5 lg:grid-cols-8 bg-secondary p-1 rounded-full h-auto">
              {allCategories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="rounded-full data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground transition-colors duration-200 text-xs md:text-sm" // Adjusted text size
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* --- Tab Content Panels --- */}

          {/* Service Package Panels */}
          {categorizedPackages.map(([category, categoryPackages]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryPackages.map((pkg, index) => (
                  <div key={pkg.id} data-aos="fade-up" data-aos-delay={index * 100}>
                    <Card className="flex flex-col bg-card/80 h-full">
                      <CardHeader>
                        <CardTitle className="text-xl md:text-2xl">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-2xl md:text-3xl font-bold mb-6">{pkg.price}</p>
                        <ul className="space-y-3">
                          {pkg.features?.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link
                            href={`/${studioId}/book?category=${encodeURIComponent(
                              pkg.category || ""
                            )}&package=${encodeURIComponent(pkg.name || "")}`}
                          >
                            Inquire Now
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}

          {/* --- Product Panels --- */}

          {/* Frames Panel */}
          <TabsContent key="Frames" value="Frames">
            <Card className="bg-card/80 p-6 md:p-8">
              <CardHeader className="p-0 mb-6 text-center">
                 <CardTitle className="text-3xl flex items-center justify-center gap-2"><FrameIcon/> Frames</CardTitle>
                 <CardDescription>High-quality frames to showcase your memories.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                {frames.map((frame, index) => (
                  <div key={frame.id} data-aos="fade-up" data-aos-delay={index * 50} className="border rounded-md p-3 bg-background/50">
                    <p className="font-semibold">{frame.size} {frame.material && `(${frame.material})`}</p>
                    {frame.description && <p className="text-xs text-muted-foreground mt-1">{frame.description}</p>}
                    <p className="font-medium mt-2">{formatCurrency(frame.price)}</p>
                  </div>
                ))}
              </CardContent>
               <CardFooter className="p-0 pt-6 justify-center">
                   <Button asChild variant="outline">
                       <Link href={`/${studioId}/book?tab=products`}>Order Frames</Link>
                   </Button>
               </CardFooter>
            </Card>
          </TabsContent>

          {/* Prints Panel */}
          <TabsContent key="Prints" value="Prints">
            <Card className="bg-card/80 p-6 md:p-8">
              <CardHeader className="p-0 mb-6 text-center">
                 <CardTitle className="text-3xl flex items-center justify-center gap-2"><Printer/> Prints</CardTitle>
                 <CardDescription>Professional quality photo prints in various sizes and finishes.</CardDescription>
              </CardHeader>
               <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                 {printSizes.map((print, index) => (
                   <div key={print.id} data-aos="fade-up" data-aos-delay={index * 50} className="border rounded-md p-3 bg-background/50">
                     <p className="font-semibold">{print.size} <span className="text-xs text-muted-foreground">({print.paper_type})</span></p>
                     <p className="font-medium mt-2">{formatCurrency(print.price)}</p>
                   </div>
                 ))}
               </CardContent>
               <CardFooter className="p-0 pt-6 justify-center">
                   <Button asChild variant="outline">
                       <Link href={`/${studioId}/book?tab=products`}>Order Prints</Link>
                   </Button>
               </CardFooter>
            </Card>
          </TabsContent>

          {/* Albums Panel */}
          <TabsContent key="Albums" value="Albums">
             <Card className="bg-card/80 p-6 md:p-8">
               <CardHeader className="p-0 mb-6 text-center">
                 <CardTitle className="text-3xl flex items-center justify-center gap-2"><BookOpen/> Albums</CardTitle>
                 <CardDescription>Beautifully crafted albums to preserve your memories.</CardDescription>
               </CardHeader>
               <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                 {albums.map((album, index) => (
                   <div key={album.id} data-aos="fade-up" data-aos-delay={index * 50} className="border rounded-md p-3 bg-background/50">
                     <p className="font-semibold">{album.size} ({album.cover_type}, {album.page_count} Pages)</p>
                     {album.description && <p className="text-xs text-muted-foreground mt-1">{album.description}</p>}
                     <p className="font-medium mt-2">{formatCurrency(album.price)}</p>
                   </div>
                 ))}
               </CardContent>
                <CardFooter className="p-0 pt-6 justify-center">
                   <Button asChild variant="outline">
                       <Link href={`/${studioId}/book?tab=products`}>Order Albums</Link>
                   </Button>
               </CardFooter>
             </Card>
          </TabsContent>

        </Tabs>
      </section>
    </div>
  );
}