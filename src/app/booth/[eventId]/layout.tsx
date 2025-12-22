// app/booth/[eventId]/layout.tsx
import { getBoothAccess } from "@/lib/booth-auth";
import { BoothLoginForm } from "@/components/booth/BoothLoginForm";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>; // <--- UPDATED TYPE (Added Promise)
}) {
  const { eventId } = await params; // This await is correct, now the type matches
  
  const accessLevel = await getBoothAccess(parseInt(eventId));

  if (!accessLevel) {
    return <BoothLoginForm eventId={parseInt(eventId)} />;
  }

  return <>{children}</>;
}