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
          {/* Tabs List - Responsive and centered */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="w-full max-w-6xl relative">
              {/* Desktop: Centered grid with appropriate columns */}
              <TabsList className="hidden md:grid w-full bg-secondary p-1 rounded-full h-auto"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(allCategories.length, 8)}, minmax(0, 1fr))`
                }}
              >
                {allCategories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 
                      data-[state=active]:bg-[#2563eb] data-[state=active]:text-white 
                      data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground 
                      data-[state=inactive]:hover:bg-muted/50 truncate"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Mobile: Horizontal scroll with centered container */}
              <div className="md:hidden relative">
                <div className="overflow-x-auto scrollbar-hide pb-2">
                  <div className="flex justify-center min-w-max px-4">
                    <TabsList className="inline-flex w-auto h-auto bg-secondary p-1 rounded-full">
                      {allCategories.map((category) => (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 
                            data-[state=active]:bg-[#2563eb] data-[state=active]:text-white 
                            data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground 
                            data-[state=inactive]:hover:bg-muted/50 mx-0.5"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
                {/* Mobile scroll hint */}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ← Scroll to view more categories →
                </p>
              </div>
            </div>
          </div>

          {/* --- Tab Content Panels --- */}

          {/* Service Package Panels */}
          {categorizedPackages.map(([category, categoryPackages]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPackages.map((pkg, index) => (
                  <div key={pkg.id} data-aos="fade-up" data-aos-delay={index * 100}>
                    <Card className="flex flex-col bg-card/80 h-full border-border/50">
                      <CardHeader>
                        <CardTitle className="text-xl md:text-2xl">{pkg.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-2xl md:text-3xl font-bold mb-6">{pkg.price}</p>
                        <ul className="space-y-2">
                          {pkg.features?.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-4">
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
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="text-center">
                 <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-2">
                   <FrameIcon className="h-6 w-6 md:h-8 md:w-8"/> Frames
                 </CardTitle>
                 <CardDescription>High-quality frames to showcase your memories.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {frames.map((frame, index) => (
                    <div 
                      key={frame.id} 
                      data-aos="fade-up" 
                      data-aos-delay={index * 50} 
                      className="border rounded-lg p-4 bg-background/50 hover:bg-accent/20 transition-colors"
                    >
                      <p className="font-semibold text-base">
                        {frame.size} 
                        {frame.material && <span className="text-sm text-muted-foreground ml-1">({frame.material})</span>}
                      </p>
                      {frame.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {frame.description}
                        </p>
                      )}
                      <p className="font-bold text-lg mt-3 text-primary">
                        {formatCurrency(frame.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
               <CardFooter className="justify-center border-t pt-6">
                   <Button asChild variant="outline" size="lg">
                       <Link href={`/${studioId}/book?tab=products`}>
                         Order Frames
                       </Link>
                   </Button>
               </CardFooter>
            </Card>
          </TabsContent>

          {/* Prints Panel */}
          <TabsContent key="Prints" value="Prints">
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="text-center">
                 <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-2">
                   <Printer className="h-6 w-6 md:h-8 md:w-8"/> Prints
                 </CardTitle>
                 <CardDescription>Professional quality photo prints in various sizes and finishes.</CardDescription>
              </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {printSizes.map((print, index) => (
                     <div 
                       key={print.id} 
                       data-aos="fade-up" 
                       data-aos-delay={index * 50} 
                       className="border rounded-lg p-4 bg-background/50 hover:bg-accent/20 transition-colors"
                     >
                       <p className="font-semibold text-base">
                         {print.size} 
                         <span className="text-sm text-muted-foreground ml-1">({print.paper_type})</span>
                       </p>
                       <p className="font-bold text-lg mt-3 text-primary">
                         {formatCurrency(print.price)}
                       </p>
                     </div>
                   ))}
                 </div>
               </CardContent>
               <CardFooter className="justify-center border-t pt-6">
                   <Button asChild variant="outline" size="lg">
                       <Link href={`/${studioId}/book?tab=products`}>
                         Order Prints
                       </Link>
                   </Button>
               </CardFooter>
            </Card>
          </TabsContent>

          {/* Albums Panel */}
          <TabsContent key="Albums" value="Albums">
             <Card className="bg-card/80 border-border/50">
               <CardHeader className="text-center">
                 <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-2">
                   <BookOpen className="h-6 w-6 md:h-8 md:w-8"/> Albums
                 </CardTitle>
                 <CardDescription>Beautifully crafted albums to preserve your memories.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {albums.map((album, index) => (
                     <div 
                       key={album.id} 
                       data-aos="fade-up" 
                       data-aos-delay={index * 50} 
                       className="border rounded-lg p-4 bg-background/50 hover:bg-accent/20 transition-colors"
                     >
                       <p className="font-semibold text-base">
                         {album.size} 
                         <span className="text-sm text-muted-foreground ml-1">
                           ({album.cover_type}, {album.page_count} Pages)
                         </span>
                       </p>
                       {album.description && (
                         <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                           {album.description}
                         </p>
                       )}
                       <p className="font-bold text-lg mt-3 text-primary">
                         {formatCurrency(album.price)}
                       </p>
                     </div>
                   ))}
                 </div>
               </CardContent>
                <CardFooter className="justify-center border-t pt-6">
                   <Button asChild variant="outline" size="lg">
                       <Link href={`/${studioId}/book?tab=products`}>
                         Order Albums
                       </Link>
                   </Button>
               </CardFooter>
             </Card>
          </TabsContent>

        </Tabs>
      </section>
    </div>
  );
}