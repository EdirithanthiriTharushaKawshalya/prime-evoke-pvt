"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import Link from "next/link"; // Import Link for the logo

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      toast.error("Login Failed!", { description: error.message });
    } else {
      toast.success("Login Successful!");
      router.push("/admin/bookings");
      router.refresh();
    }
  };

  return (
    // Ensure container takes full height and centers content
    <div className="relative flex items-center justify-center min-h-screen p-4">
      <AnimatedBackground />
      {/* --- Updated Card Styling --- */}
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg">
        {" "}
        {/* Added transparency, blur, border, rounded-xl */}
        <CardHeader className="text-center pt-8 pb-4">
          {" "}
          {/* Adjusted padding */}
          {/* 1. Added Logo Link */}
          <Link
            href="/"
            className="mb-4 inline-block text-xl font-bold tracking-tight text-white"
          >
            Prime Evoke{" "}
            <span className="text-muted-foreground">Private Limited </span>
          </Link>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>{" "}
          {/* Adjusted title */}
          <CardDescription className="text-muted-foreground/80">
            {" "}
            {/* Adjusted description color */}
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-6">
          {" "}
          {/* Adjusted padding */}
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2 pl-5 pr-5">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>{" "}
              {/* Adjusted label color */}
              <Input
                id="email"
                type="email"
                placeholder="someone@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-background/70 border-white/20 focus:border-white/50 " // Input styling
              />
            </div>
            <div className="grid gap-2 pl-5 pr-5">
              <Label htmlFor="password" className="text-muted-foreground">
                Password
              </Label>{" "}
              {/* Adjusted label color */}
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-background/70 border-white/20 focus:border-white/50" // Input styling
              />
              {/* Optional: Add "Forgot Password?" link here */}
            </div>
            
            <div className="flex justify-center pt-2">
              <Button type="submit" disabled={loading} className="px-15">
                {" "}
                {/* Example: Added px-12 */}
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
