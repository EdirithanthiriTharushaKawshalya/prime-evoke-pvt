import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStudioData, getPortfolioItems } from "@/lib/data";
import { Studio, PortfolioItem } from "@/lib/types";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Facebook } from "lucide-react";
import { PortfolioCarousel } from "@/components/ui/PortfolioCarousel";
import { PortfolioCard } from "@/components/ui/PortfolioCard"; // Import the NON-ASYNC PortfolioCard
import { AnimatedStats } from "@/components/ui/AnimatedStats";

export default async function StudioHomePage({
  params,
}: {
  params: Promise<{ studioId: string }>; // Correctly typed params
}) {
  const { studioId } = await params; // Await params at the beginning

  // --- Data Fetching ---

  // 1. Fetch the main studio data
  const studioData: Studio = await getStudioData(studioId);

  // 2. Fetch the 6 most recent portfolio items
  const recentWorkItems: PortfolioItem[] = (
    await getPortfolioItems(studioId)
  ).slice(0, 6);

  // 3. "Enrich" the portfolio items with their public image URLs
  const enrichedWorkItems = await Promise.all(
    recentWorkItems.map(async (item) => {
      let publicImageUrl = "/placeholder.jpg";
      if (item.thumbnail_url) {
        const { data } = supabase.storage
          .from("portfolio-thumbnails") // Make sure this bucket name is correct!
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

  // 4. Get the Hero Image URL
  let heroImageUrl = "/placeholder.jpg";
  if (studioData.hero_image_url) {
    const { data } = supabase.storage
      .from("studio-images") // Make sure this bucket name is correct!
      .getPublicUrl(studioData.hero_image_url);
    if (data) {
      heroImageUrl = data.publicUrl;
    }
  }

  return (
    <>
      {/* --- Hero Section --- */}
      <section
        className="container mx-auto py-16 md:py-16 px-4"
        data-aos="fade-up"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div
            className="md:col-span-3"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {studioData.hero_subtitle}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              {studioData.hero_title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              {studioData.hero_description}
            </p>
            <Button size="lg" asChild>
              <Link href={`/${studioId}/book`}>Book Now</Link>
            </Button>

            <hr className="my-12 opacity-30" />

            {/* Stats Section now uses the AnimatedStats client component */}
            {studioData.stats && <AnimatedStats stats={studioData.stats} />}
          </div>

          {/* Right Column: Image */}
          <div
            className="md:col-span-2"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Image
              src={heroImageUrl}
              alt={studioData.name || "Studio Hero Image"}
              width={600}
              height={800}
              className="object-cover w-full h-auto rounded-tl-[4rem] rounded-bl-[4rem] rounded-tr-[4rem]"
            />
          </div>
        </div>
      </section>

      {/* --- New Portfolio Preview Section --- */}
      {/* Animate the entire section */}
      <section
        className="container mx-auto py-16 md:py-24 text-center"
        data-aos="fade-up"
      >
        <h2 className="text-3xl font-bold mb-8">Our Recent Work</h2>

        <div className="px-12">
          {/* Pass the enriched items, rendering cards on the server */}
          <PortfolioCarousel
            items={enrichedWorkItems.map((item) => (
              <PortfolioCard key={item.id} item={item} />
            ))}
          />
        </div>

        <Button variant="outline" asChild className="mt-12">
          {/* Use the unwrapped studioId variable */}
          <Link href={`/${studioId}/portfolio`}>Explore Full Portfolio</Link>
        </Button>
      </section>

      {/* --- Why Choose Us Section --- */}
      {/* Conditionally render if data exists */}
      {studioData.why_choose_us && studioData.why_choose_us.length > 0 && (
        <section
          className="container mx-auto py-16 md:py-24 px-4"
          data-aos="fade-up"
        >
          <div className="text-center md:text-left mb-12">
            {" "}
            {/* Adjusted text alignment for larger screens */}
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Why Choose Us?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Unparalleled Excellence in Photography{" "}
              {/* You might make this dynamic later */}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {studioData.why_choose_us.map((point, index) => (
              // Stagger animation for each point
              <div key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <p className="text-sm font-semibold text-muted-foreground mb-2">
                  0{index + 1} {/* Display number */}
                </p>
                <h3 className="text-xl font-bold mb-3">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- New Call-to-Action Section --- */}
      {/* This only renders if a Facebook URL exists in the database */}
      {studioData.facebook_url && (
        // Animate the entire section
        <section
          className="container mx-auto px-4 py-16 md:py-24"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="bg-secondary py-16 md:py-15 rounded-3xl text-center max-w-5xl mx-auto px-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Connect With Us
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">
              Join Our Community on Facebook
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Follow our page for the latest updates, behind-the-scenes content,
              and special offers from {studioData.name}.
            </p>
            <Button size="lg" variant="outline" asChild>
              {/* This link is now DYNAMIC */}
              <a
                href={studioData.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Facebook className="h-4 w-4" />
                Follow Us
              </a>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
