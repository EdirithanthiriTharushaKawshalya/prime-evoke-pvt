import { StudioFooter } from "@/components/layout/StudioFooter";
import { StudioHeader } from "@/components/layout/StudioHeader";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;

  return (
    <div className="flex flex-col min-h-screen relative">
      {" "}
      <AnimatedBackground /> 
      <StudioHeader studioId={studioId} />
      <main className="flex-1">{children}</main>
      <StudioFooter studioId={studioId} />
    </div>
  );
}
