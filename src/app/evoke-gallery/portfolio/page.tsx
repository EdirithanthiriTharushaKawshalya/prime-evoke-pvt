import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PortfolioPage() {
  // Placeholder data for portfolio categories. Later, this will come from Supabase.
  const categories = [
    { name: "Weddings", imageCount: 12 },
    { name: "Portraits", imageCount: 8 },
    { name: "Events", imageCount: 15 },
  ];

  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Our Work
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          A collection of moments we&apos;ve had the honor of capturing. Click on a
          category to explore the gallery.
        </p>
      </section>

      {/* Categories Section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Card key={category.name} className="overflow-hidden group cursor-pointer">
              <CardHeader className="p-0">
                {/* Placeholder for the category cover image */}
                <div className="bg-secondary h-64 w-full group-hover:scale-105 transition-transform duration-300"></div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-xl">{category.name}</CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}