import { StudioFooter } from "@/components/layout/StudioFooter";
import { StudioHeader } from "@/components/layout/StudioHeader";

// This layout now receives "params" which contains the studioId from the URL
export default function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { studioId: string };
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* We pass the studioId to the header and footer as a "prop" */}
      <StudioHeader studioId={params.studioId} />
      <main className="flex-1">{children}</main>
      <StudioFooter studioId={params.studioId} />
    </div>
  );
}