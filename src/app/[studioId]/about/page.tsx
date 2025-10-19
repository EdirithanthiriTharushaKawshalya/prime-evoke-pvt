import { Button } from "@/components/ui/button";
import { getStudioData } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// Make the component async and accept params
export default async function AboutPage({
  params,
}: {
  params: Promise<{ studioId: string }>; // Correctly type params as Promise
}) {
  const { studioId } = await params; // Await params
  const studioData = await getStudioData(studioId);

  // Split the about_text into paragraphs
  const paragraphs = studioData.about_text?.split("\n\n") || [];

  // --- Fetch Logo URL ---
  let logoPublicUrl = "/placeholder-logo.png"; // Default placeholder
  if (studioData.logo_url) {
    const { data } = supabase.storage
      .from("studio-images") // Assuming logos are in the same bucket
      .getPublicUrl(studioData.logo_url);
    if (data?.publicUrl) {
      logoPublicUrl = data.publicUrl;
    }
  }

  return (
    <div className="container mx-auto py-12 md:py-24 px-6"
    data-aos="fade-up"
    >
      {/* Page Header */}
      <section className="text-center mb-12 md:mb-16" data-aos="fade-up">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          About {studioData.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          The heart and vision behind the lens.
        </p>
      </section>

      {/* Main Content Section */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center" data-aos="fade-up" >
        {/* --- Updated Image Section --- */}
        <div className="md:col-span-2 flex items-center justify-center p-4">
          {" "}
          {/* Added flex for centering */}
          <Image
            src={logoPublicUrl}
            alt={`${studioData.name} Logo`}
            width={300} // Adjust width as needed
            height={300} // Adjust height as needed
            className="object-contain max-h-[300px]" // Use object-contain
          />
        </div>

        {/* Bio Text */}
        <div className="md:col-span-3">
          <h2 className="text-3xl font-bold mb-4">Our Story</h2>
          {/* Map over the paragraphs and render each in a <p> tag */}
          <div className="space-y-4 text-muted-foreground">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="mt-16 md:mt-24 text-center bg-secondary py-16 rounded-3xl max-w-5xl mx-auto px-6" data-aos="fade-up">
        <h2 className="text-3xl font-bold mb-4">Let&apos;s Tell Your Story</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          We would be honored to be a part of your journey. Reach out to discuss
          your vision.
        </p>
        <Button size="lg" asChild>
          <Link href={`/${studioId}/book`}>Get in Touch</Link>
        </Button>
      </section>
    </div>
  );
}
