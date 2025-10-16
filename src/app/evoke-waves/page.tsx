import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Button } from "@/components/ui/button";

export default function EvokeWavesPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 px-6">
      <AnimatedBackground /> 
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Evoke Waves
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional music production and sound design. We craft unique
          soundscapes that bring your creative vision to life.
        </p>
      </section>

      {/* Services Section */}
      <section className="mt-16 md:mt-24">
        <h2 className="text-3xl font-bold text-center mb-8">What We Do</h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Music Production</h3>
            <p className="text-muted-foreground">
              From initial concept to a fully realized track.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Mixing & Mastering</h3>
            <p className="text-muted-foreground">
              Polishing your sound for a professional, radio-ready finish.
            </p>
          </div>
          <div className="p-6 border rounded-lg md:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-semibold mb-2">Sound Design</h3>
            <p className="text-muted-foreground">
              Creating custom sounds and effects for film, games, and media.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="mt-16 md:mt-24 text-center bg-secondary py-16 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Have a project in mind?</h2>
        <p className="text-muted-foreground mb-8">
          Let&apos;s talk about how we can collaborate.
        </p>
        <Button size="lg" asChild>
          <a href="mailto:contact@primeevoke.com">Get in Touch</a>
        </Button>
      </section>
    </div>
  );
}
