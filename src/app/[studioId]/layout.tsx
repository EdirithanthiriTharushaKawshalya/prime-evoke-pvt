import { StudioFooter } from "@/components/layout/StudioFooter";
import { StudioHeader } from "@/components/layout/StudioHeader";
import React from "react"; // Make sure React is imported


type StudioLayoutProps = {
  children: React.ReactNode;
  params: {
    studioId: string;
  };
};

export default function StudioLayout({ children, params }: StudioLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <StudioHeader studioId={params.studioId} />
      <main className="flex-1">{children}</main>
      <StudioFooter studioId={params.studioId} />
    </div>
  );
}