import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

// Helper function to get studio data
async function getStudioData(studioId: string) {
  const { data: studio, error } = await supabase
    .from("studios")
    .select("*")
    .eq("slug", studioId)
    .single(); // .single() gets one record or throws an error

  if (error || !studio) {
    notFound(); // If studio doesn't exist, show a 404 page
  }
  return studio;
}

export default async function StudioHomePage({
  params,
}: {
  params: { studioId: string };
}) {
  // Fetch the specific data for this studio
  const studioData = await getStudioData(params.studioId);

  return (
    <>
      {/* Hero Section */}
      <section className="h-[60vh] md:h-[80vh] flex items-center justify-center text-center relative bg-secondary">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="relative z-20 p-4">
          {/* Use the dynamic data from Supabase */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-white">
            {studioData.hero_title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            {studioData.hero_subtitle}
          </p>
          <Button size="lg" asChild>
            <Link href={`/${params.studioId}/portfolio`}>View Our Work</Link>
          </Button>
        </div>
      </section>

      {/* Portfolio Preview Section */}
      <section className="container mx-auto py-16 md:py-24 text-center">
        <h2 className="text-3xl font-bold mb-8">Our Recent Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
          <div className="bg-secondary h-64 md:h-80 rounded-md"></div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${params.studioId}/portfolio`}>
            Explore Full Portfolio
          </Link>
        </Button>
      </section>

      {/* Testimonial Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container mx-auto text-center max-w-3xl">
          <blockquote className="text-xl md:text-2xl italic">
            "The photos were breathtaking. They perfectly captured the emotion
            of our special day. We couldn&apos;t be happier!"
          </blockquote>
          <p className="mt-4 text-muted-foreground">- Sarah & Tom</p>
        </div>
      </section>
    </>
  );
}
