// components/layout/Footer.tsx
import { SystemMenu } from "@/components/layout/SystemMenu";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 md:px-12 border-t mt-auto relative backdrop-blur-sm">
      <div className="container mx-auto text-center text-muted-foreground text-sm relative">
        <p>© {currentYear} Prime Evoke Private Limited. All Rights Reserved.</p>

        {/* Hidden System Menu (Bottom Right) */}
        <div className="absolute bottom-0 right-0 translate-y-1/4">
           <SystemMenu />
        </div>
      </div>
    </footer>
  );
}