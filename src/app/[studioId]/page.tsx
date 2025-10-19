import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getStudioData } from "@/lib/data";
import { Studio } from "@/lib/types";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight } from "lucide-react";
import { Facebook } from "lucide-react";

export default async function StudioHomePage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const studioData: Studio = await getStudioData(studioId);

  let heroImageUrl = "/placeholder.jpg";
  if (studioData.hero_image_url) {
    const { data } = supabase.storage
      .from("studio-images")
      .getPublicUrl(studioData.hero_image_url);
    if (data) {
      heroImageUrl = data.publicUrl;
    }
  }

  return (
    <>
      {/* --- New Hero Section --- */}
      <section className="container mx-auto py-16 md:py-16 px-4">
        {/* ... (Your hero section code remains unchanged) ... */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="md:col-span-3">
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

            {/* Stats Section */}
            {studioData.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {studioData.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-4xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Image */}
          <div className="md:col-span-2">
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

      {/* --- Portfolio Preview Section (Unchanged) --- */}
      <section className="container mx-auto py-16 md:py-24 text-center">
        <h2 className="text-3xl font-bold mb-8">Our Recent Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Placeholder images */}
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
        </div>
        <Button variant="outline" asChild>
          {/* 3. Use the unwrapped 'studioId' variable */}
          <Link href={`/${studioId}/portfolio`}>Explore Full Portfolio</Link>
        </Button>
      </section>
      {/* --- New Call-to-Action Section --- */}
      {/* We only render this section if a Facebook URL exists in the database */}
      {studioData.facebook_url && (
        <section className="container mx-auto px-4 py-16 md:py-24">
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
