"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { verifyBoothPin } from "@/lib/booth-auth";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export function BoothLoginForm({ eventId }: { eventId: number }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await verifyBoothPin(eventId, code);

    if (res.success) {
      toast.success(res.role === 'admin' ? "Admin Access Granted" : "View-Only Access Granted");
      router.refresh(); // Refresh to let the layout render the real content
    } else {
      toast.error(res.error || "Invalid Code");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <Card className="w-full max-w-md bg-zinc-950/80 backdrop-blur-md border-white/10 z-10 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-2">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Event Access</CardTitle>
          <CardDescription>Enter the access code to view this event.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="password" 
              placeholder="Enter Access Code" 
              className="bg-black/40 border-white/10 text-center text-lg tracking-widest h-12"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <Button disabled={loading} className="w-full h-12 text-base font-medium">
              {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center">Enter Event <ArrowRight className="ml-2 h-4 w-4" /></span>}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Contact Prime Evoke management if you don't have a code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}