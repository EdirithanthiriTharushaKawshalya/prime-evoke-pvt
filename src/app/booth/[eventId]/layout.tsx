// app/booth/[eventId]/layout.tsx
import { getBoothAccess } from "@/lib/booth-auth";
import { BoothLoginForm } from "@/components/booth/BoothLoginForm";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { eventId: string };
}) {
  const { eventId } = await params;
  
  // Check if user has entered a valid code
  const accessLevel = await getBoothAccess(parseInt(eventId));

  // If no access, show Login Screen instead of the page
  if (!accessLevel) {
    return <BoothLoginForm eventId={parseInt(eventId)} />;
  }

  // If valid, show the page content
  return <>{children}</>;
}