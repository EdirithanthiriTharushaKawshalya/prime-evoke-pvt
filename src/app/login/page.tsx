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
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false); // Stop loading to allow retry
        
        // Provide specific feedback for incorrect passwords vs other errors
        let errorMessage = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password. Please try again.";
        }

        toast.error("Login Failed", { 
          description: errorMessage 
        });
        return;
      }

      // Login Successful
      toast.success("Login Successful", {
        description: "Redirecting to dashboard...",
      });

      // Keep loading state true (button says "Logging in...") while redirecting
      // Add a small delay to ensure the user sees the success toast
      setTimeout(() => {
        router.replace("/admin/bookings");
        router.refresh();
      }, 1000);

    } catch (err) {
      setLoading(false);
      toast.error("System Error", { 
        description: "An unexpected error occurred. Please try again." 
      });
    }
  };

  return (
    // Ensure container takes full height and centers content
    <div className="relative flex items-center justify-center min-h-screen p-4">
      <AnimatedBackground />
      {/* --- Updated Card Styling --- */}
      <Card 
        className="w-full max-w-md bg-background/80 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg"
        data-aos="fade-up"
      >
        <CardHeader className="text-center pt-8 pb-4">
          {/* 1. Added Logo Link */}
          <Link
            href="/"
            className="mb-4 inline-block text-xl font-bold tracking-tight text-white"
          >
            Prime Evoke{" "}
            <span className="text-muted-foreground">Private Limited </span>
          </Link>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-6">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2 pl-5 pr-5">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="someone@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-background/70 border-white/20 focus:border-white/50"
              />
            </div>
            <div className="grid gap-2 pl-5 pr-5">
              <Label htmlFor="password" className="text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-background/70 border-white/20 focus:border-white/50"
              />
            </div>
            
            <div className="flex justify-center pt-2">
              <Button type="submit" disabled={loading} className="px-15">
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}