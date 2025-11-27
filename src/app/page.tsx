import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Camera } from "lucide-react"; // Import icon

export default function HomePage() {
  return (
    <div>
      <AnimatedBackground />
      <Header />
      {/* Hero Section */}
      {/* 1. Added fade-up animation */}
      <section
        className="text-center py-20 md:py-32 px-4"
        data-aos="fade-up" // <-- Animation added
      >
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Capturing Moments, Crafting Sound.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The professional hub for Prime Evoke&apos;s creative ventures in
            photography, visual storytelling, and music production.
          </p>
        </div>
      </section>

      {/* Sub-Brands Gateway Section */}
      <section className="container mx-auto pb-20 md:pb-32 px-4">
        {/* Changed grid to 2 columns on tablet/desktop to accommodate 4 items nicely */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Evoke Gallery Card */}
          {/* 2. Added fade-up animation with delay */}
          <Card
            className="flex flex-col rounded-3xl md:rounded-full text-center"
            data-aos="fade-up" // <-- Animation added
            data-aos-delay="100" // <-- Staggered delay added
          >
            <CardHeader className="flex-1 p-8 md:p-12">
              <CardTitle className="text-2xl">Evoke Gallery</CardTitle>
              <CardDescription>
                Professional Photography Services
              </CardDescription>
              <p className="text-muted-foreground mt-4">
                Specializing in weddings and timeless portraits, we capture the
                moments that matter with an artistic touch.
              </p>
            </CardHeader>
            <CardFooter className="flex justify-center p-8 md:pt-0">
              <Button asChild>
                <Link href="/evoke-gallery">Explore the Gallery</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Studio Zine Card */}
          {/* 3. Added fade-up animation with delay */}
          <Card
            className="flex flex-col rounded-3xl md:rounded-full text-center"
            data-aos="fade-up" // <-- Animation added
            data-aos-delay="200" // <-- Staggered delay added
          >
            <CardHeader className="flex-1 p-8 md:p-12">
              <CardTitle className="text-2xl">Studio Zine</CardTitle>
              <CardDescription>Creative Visual Storytelling</CardDescription>
              <p className="text-muted-foreground mt-4">
                Our focus is on modern, impactful visuals for brands, events,
                and creative professionals who need to stand out.
              </p>
            </CardHeader>
            <CardFooter className="flex justify-center p-8 md:pt-0">
              <Button asChild>
                <Link href="/studio-zine">Visit the Studio</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Evoke Waves Card */}
          {/* 4. Added fade-up animation with delay */}
          <Card
            className="flex flex-col rounded-3xl md:rounded-full text-center"
            data-aos="fade-up" // <-- Animation added
            data-aos-delay="300" // <-- Staggered delay added
          >
            <CardHeader className="flex-1 p-8 md:p-12">
              <CardTitle className="text-2xl">Evoke Waves</CardTitle>
              <CardDescription>Music Production & Sound Design</CardDescription>
              <p className="text-muted-foreground mt-4">
                From custom sound design for media to full-track mixing and
                mastering, we shape sound to tell your story.
              </p>
            </CardHeader>
            <CardFooter className="flex justify-center p-8 md:pt-0">
              <Button asChild>
                <Link href="/evoke-waves">Learn More</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* --- NEW CARD: Evoke Rentals --- */}
          <Card
            className="flex flex-col rounded-3xl text-center border-white/10 bg-card/40 backdrop-blur-sm"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <CardHeader className="flex-1 p-8 md:p-12">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Evoke Rentals</CardTitle>
              <CardDescription>Premium Equipment Hire</CardDescription>
              <p className="text-muted-foreground mt-4">
                Access our professional arsenal. Cameras, lenses, lighting, and
                support gear available for your own productions.
              </p>
            </CardHeader>
            <CardFooter className="flex justify-center p-8 md:pt-0">
              <Button asChild variant="outline" className="border-primary/50 hover:bg-primary/10">
                <Link href="/rentals">Browse Equipment</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* --- Meet the Team Link Section --- */}
        <section className="mt-16 md:mt-30 text-center" data-aos="fade-up">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Discover the passionate and qualified individuals behind Prime
            Evoke.
          </p>
          <Button size="lg" asChild>
            <Link href="/team">View Team Profiles</Link>
          </Button>
        </section>
      </section>
      <Footer />
    </div>
  );
}