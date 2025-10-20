import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Check } from "lucide-react";
import { ServicePackage } from "@/lib/types";
import { getStudioData } from "@/lib/data";

// Helper function to group packages by category
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

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const studioData = await getStudioData(studioId);

  // Fetch all services for this studio
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("studio_name", studioData.name)
    .order("category")
    .order("id");

  const packages: ServicePackage[] | null = data;

  if (error || !packages) {
    console.error("Error fetching services:", error);
    return <p>Error loading services. Please try again later.</p>;
  }

  // Group packages by category
  const categorizedPackages = categorizeServices(packages);

  // Handle case where there might be no packages
  if (categorizedPackages.length === 0) {
    return (
      <div
        className="container mx-auto py-12 md:py-24 px-4 text-center"
        data-aos="fade-up" // Animate empty state too
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
          {studioData.name} Services & Packages
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          No packages available at this time. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 md:py-24 px-4">
      {/* Page Header */}
      {/* 1. Added animation to header */}
      <section className="text-center mb-12 md:mb-16" data-aos="fade-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          {studioData.name} Services & Packages
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Choose the perfect package that fits your needs.
        </p>
      </section>

      {/* --- Tabbed Interface for Packages --- */}
      {/* 2. Added animation to the main tabs section */}
      <section data-aos="fade-up" data-aos-delay="100">
        <Tabs defaultValue={categorizedPackages[0]?.[0]} className="w-full">
          {/* Add a wrapper div to center and control width */}
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-lg grid-cols-2 md:grid-cols-4 bg-secondary p-1 rounded-full h-auto">
              {categorizedPackages.map(([category]) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="rounded-full data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground transition-colors duration-200"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Create the Tab Content Panels */}
          {categorizedPackages.map(([category, categoryPackages]) => (
            <TabsContent key={category} value={category}>
              {/* Grid for packages within this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryPackages.map((pkg, index) => (
                  // 3. Added animation to each card with staggered delay
                  <div
                    key={pkg.id}
                    data-aos="fade-up"
                    data-aos-delay={index * 100} // Stagger cards within tab
                  >
                    <Card className="flex flex-col bg-card/80 h-full">
                      {" "}
                      {/* Added h-full for consistent height */}
                      <CardHeader>
                        <CardTitle className="text-xl md:text-2xl">
                          {pkg.name}
                        </CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-2xl md:text-3xl font-bold mb-6">
                          {pkg.price}
                        </p>
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
        </Tabs>
      </section>
    </div>
  );
}
