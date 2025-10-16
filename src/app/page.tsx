import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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
      <Header />
      {/* Hero Section */}
      <section className="text-center py-20 md:py-32">
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
      <section className="container mx-auto pb-20 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Evoke Gallery Card */}
          <Card className="flex flex-col">
            <CardHeader className="flex-1">
              <CardTitle className="text-2xl">Evoke Gallery</CardTitle>
              <CardDescription>
                Professional Photography Services
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/evoke-gallery">Explore the Gallery</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Studio Zine Card */}
          <Card className="flex flex-col">
            <CardHeader className="flex-1">
              <CardTitle className="text-2xl">Studio Zine</CardTitle>
              <CardDescription>Creative Visual Storytelling</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/studio-zine">Visit the Studio</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Evoke Waves Card */}
          <Card className="flex flex-col">
            <CardHeader className="flex-1">
              <CardTitle className="text-2xl">Evoke Waves</CardTitle>
              <CardDescription>Music Production & Sound Design</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
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