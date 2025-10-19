import { Button } from "@/components/ui/button";
import { getStudioData } from "@/lib/data"; // 👈 Import the data function
import Link from "next/link";

// Make the component async and accept params
export default async function AboutPage({
  params,
}: {
  params: { studioId: string };
}) {
  // Fetch the specific data for this studio
  const studioData = await getStudioData(params.studioId);

  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      <section className="text-center mb-12 md:mb-16">
        {/* Use the dynamic studio name */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          About {studioData.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          The heart and vision behind the lens.
        </p>
      </section>

      {/* Main Content Section */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
        {/* Photographer Image Placeholder */}
        <div className="md:col-span-2">
          <div className="aspect-square bg-secondary rounded-lg w-full h-auto">
            {/* Placeholder: We'll load studioData.photographer_image_url here later */}
          </div>
        </div>

        {/* Bio Text */}
        <div className="md:col-span-3">
          <h2 className="text-3xl font-bold mb-4">Our Story</h2>
          <div className="space-y-4 text-muted-foreground">
            {/* Use the dynamic "about_text" from Supabase */}
            <p>{studioData.about_text}</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mt-16 md:mt-24 text-center bg-secondary py-16 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Let&apos;s Tell Your Story</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          We would be honored to be a part of your journey. Reach out to discuss
          your vision.
        </p>
        <Button size="lg" asChild>
          {/* Make the link dynamic */}
          <Link href={`/${params.studioId}/book`}>Get in Touch</Link>
        </Button>
      </section>
    </div>
  );
}