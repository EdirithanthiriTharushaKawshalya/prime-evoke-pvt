"use client"; // DropdownMenu requires client-side interaction

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // 1. Import DropdownMenu components
import { Menu } from "lucide-react"; // Hamburger menu icon

export function StudioHeader({ studioId }: { studioId: string }) {
  // Convert slug to display name
  const studioName = studioId
    ?.replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Navigation links array
  const navLinks = [
    { href: `/${studioId}/portfolio`, label: "Portfolio" },
    { href: `/${studioId}/services`, label: "Services" },
    { href: `/${studioId}/about`, label: "About" },
  ];

  return (
    <header className="py-4 px-4 md:px-12 border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Studio Name/Logo */}
        <Link href={`/${studioId}`} className="text-lg font-bold">
          {studioName}
        </Link>

        {/* --- Desktop Navigation Links --- */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href={`/${studioId}/book`}>Book Now</Link>
          </Button>
        </nav>

        {/* --- Mobile Menu Button & Dropdown --- */}
        <div className="md:hidden"> {/* Only show on mobile */}
          {/* 2. Use DropdownMenu components */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56"> {/* Align menu to the right */}
              {navLinks.map((link) => (
                // Use DropdownMenuItem for each link
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="w-full">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator /> {/* Add a line separator */}
              {/* Add Book Now as a distinct item */}
              <DropdownMenuItem asChild>
                 <Link href={`/${studioId}/book`} className="w-full font-semibold">Book Now</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}