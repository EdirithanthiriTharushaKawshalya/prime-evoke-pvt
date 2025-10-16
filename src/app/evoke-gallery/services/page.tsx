import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Check } from "lucide-react";

export default async function ServicesPage() {
  
  // Fetch data, but ONLY for Evoke Gallery
  const { data: packages, error } = await supabase
    .from('services')
    .select('*')
    .eq('studio_name', 'Evoke Gallery') // <-- THIS IS THE NEW LINE
    .order('id'); 

  if (error) {
    console.error("Error fetching services:", error);
    return <p>Error loading services. Please try again later.</p>;
  }

  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Our Services & Packages
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Choose the perfect package that fits the needs of your special day.
        </p>
      </section>

      {/* Packages Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {packages?.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-3xl font-bold mb-6">{pkg.price}</p>
              <ul className="space-y-4">
                {pkg.features?.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/evoke-gallery/book">Inquire Now</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}