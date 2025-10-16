import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      {/* Page Header */}
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
          About Evoke Gallery
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
            {/* Placeholder for a professional headshot */}
          </div>
        </div>

        {/* Bio Text */}
        <div className="md:col-span-3">
          <h2 className="text-3xl font-bold mb-4">Our Story</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Welcome to Evoke Gallery, where we believe photography is more than
              just taking pictures—it&apos;s about telling stories. Founded by
              [Photographer&apos;s Name], our passion is to capture the genuine emotions and
              fleeting moments that make your special day unforgettable.
            </p>
            <p>
              With over a decade of experience in wedding and portrait
              photography, we have honed a style that is both timeless and
              artistic. We focus on natural light and authentic interactions to
              create images that you and your family will cherish for generations.
            </p>
            <p>
              Our mission is to provide a seamless and enjoyable experience from
              our first meeting to the final delivery of your beautiful gallery.
            </p>
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
          <Link href="/evoke-gallery/book">Get in Touch</Link>
        </Button>
      </section>
    </div>
  );
}