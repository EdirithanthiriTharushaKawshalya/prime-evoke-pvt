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

export default function HomePage() {
  return (
    <div>
      <AnimatedBackground />
      <Header />
      {/* Hero Section */}
      {/* 1. ADDED px-4 for mobile padding */}
      <section className="text-center py-20 md:py-32 px-4">
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
      {/* 2. ADDED px-4 for mobile padding */}
      <section className="container mx-auto pb-20 md:pb-32 px-4">
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Evoke Gallery Card */}
          <Card className="flex flex-col rounded-3xl md:rounded-full text-center">
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
          <Card className="flex flex-col rounded-3xl md:rounded-full text-center">
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
          <Card className="flex flex-col rounded-3xl md:rounded-full text-center">
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
        </div>
      </section>
      <Footer />
    </div>
  );
}