import { getStudioData } from "@/lib/data";
import { getPortfolioItems } from "@/lib/data";
import { PortfolioItem } from "@/lib/types";
import { PortfolioCard } from "@/components/ui/PortfolioCard"; // Import the NON-ASYNC card
import { supabase } from "@/lib/supabaseClient"; // Import supabase

// Helper function to group items by category
function categorizeItems(items: PortfolioItem[]) {
  const categorized: { [key: string]: PortfolioItem[] } = {};
  for (const item of items) {
    if (!categorized[item.category]) {
      categorized[item.category] = [];
    }
    categorized[item.category].push(item);
  }
  return categorized;
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;

  const studioData = await getStudioData(studioId);
  const portfolioItems = await getPortfolioItems(studioId);

  // Enrich items with image URLs ON THE SERVER
  const enrichedItems = await Promise.all(
    portfolioItems.map(async (item) => {
      let publicImageUrl = "/placeholder.jpg";
      if (item.thumbnail_url) {
        const { data } = supabase.storage
          .from("portfolio-thumbnails") // Make sure this is your bucket name
          .getPublicUrl(item.thumbnail_url);
        if (data) {
          publicImageUrl = data.publicUrl;
        }
      }
      return {
        ...item,
        publicImageUrl: publicImageUrl, // Add the image URL property
      };
    })
  );

  // Categorize the ENRICHED items
  const categorizedItems = categorizeItems(enrichedItems);

  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      {/* 1. Added fade-up animation */}
      <section className="text-center mb-12" data-aos="fade-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          {studioData.name} Portfolio
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          A collection of our recent work. Click on any project to see the full
          album.
        </p>
      </section>

      {/* Categories Section */}
      <section className="space-y-12">
        {Object.entries(categorizedItems).map(([category, items], categoryIndex) => (
          // 2. Added fade-up animation to each category section with a delay
          <div key={category} data-aos="fade-up" data-aos-delay={categoryIndex * 100}>
            <h2 className="text-3xl font-bold mb-6">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 5. Pass the ENRICHED item to the NON-ASYNC card */}
              {items.map((item, itemIndex) => (
                // 3. Added fade-up animation to each card with staggered delay
                <div key={item.id} data-aos="fade-up" data-aos-delay={itemIndex * 100}>
                  <PortfolioCard item={item} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}