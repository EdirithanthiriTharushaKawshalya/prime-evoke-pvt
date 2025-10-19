import { getStudioData } from "@/lib/data";
import { getPortfolioItems } from "@/lib/data";
import { PortfolioItem } from "@/lib/types";
import { PortfolioCard } from "@/components/ui/PortfolioCard";

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
  params: { studioId: string };
}) {
  const studioData = await getStudioData(params.studioId);
  const portfolioItems = await getPortfolioItems(params.studioId);
  const categorizedItems = categorizeItems(portfolioItems);

  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      <section className="text-center mb-12">
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
        {Object.entries(categorizedItems).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-3xl font-bold mb-6">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <PortfolioCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}