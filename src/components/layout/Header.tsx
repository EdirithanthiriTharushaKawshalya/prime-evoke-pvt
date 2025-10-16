import Link from "next/link";

export function Header() {
  return (
    <header className="py-4 px-6 md:px-12 border-b">
      <div className="container mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Prime Evoke <span className="text-muted-foreground">Private Limited</span>
        </Link>
      </div>
    </header>
  );
}