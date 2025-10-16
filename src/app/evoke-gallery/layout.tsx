import { StudioFooter } from "@/components/layout/StudioFooter";
import { StudioHeader } from "@/components/layout/StudioHeader";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <StudioHeader />
      <main className="flex-1">{children}</main>
      <StudioFooter />
    </div>
  );
}