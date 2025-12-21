"use client";

import Link from "next/link";
import { Settings, Lock, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SystemMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="System Access"
          className="text-muted-foreground/20 hover:text-foreground transition-colors p-2 outline-none"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        side="top" 
        className="w-48 bg-zinc-950 border-zinc-800 text-zinc-400"
      >
        {/* Admin Link */}
        <DropdownMenuItem asChild className="focus:bg-zinc-900 focus:text-white cursor-pointer">
          <Link href="/admin" className="flex items-center gap-2 w-full">
            <Lock className="h-4 w-4" />
            <span>Admin Hub</span>
          </Link>
        </DropdownMenuItem>

        {/* Photo Booth Link */}
        <DropdownMenuItem asChild className="focus:bg-zinc-900 focus:text-white cursor-pointer">
          <Link href="/booth" className="flex items-center gap-2 w-full">
            <Printer className="h-4 w-4" />
            <span>Photo Booth</span>
          </Link>
        </DropdownMenuItem>

        {/* Future links can be added here easily */}
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}