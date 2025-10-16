import Link from "next/link";

export function StudioFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto">
      <div className="container mx-auto text-center text-muted-foreground text-sm">
        <p>© {currentYear} Evoke Gallery. Part of <Link href="/" className="underline hover:text-foreground">Prime Evoke Private Limited</Link>.</p>
      </div>
    </footer>
  );
}