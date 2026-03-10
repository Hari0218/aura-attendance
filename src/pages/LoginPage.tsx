import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Scan, Sparkles } from "lucide-react";

function FaceIllustration() {
  return (
    <div className="relative w-72 h-72">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-400/20 blur-3xl animate-glow-pulse" />

      {/* Face outline */}
      <div className="absolute inset-8 rounded-full border-2 border-primary/40 animate-float shadow-[0_0_40px_hsl(243_75%_59%/0.15)]">
        <div className="absolute inset-3 rounded-full border border-primary/20" />
        <div className="absolute inset-6 rounded-full border border-primary/10" />
        {/* Eyes */}
        <div className="absolute top-[35%] left-[25%] w-3.5 h-3.5 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(243_75%_59%/0.5)]" />
        <div className="absolute top-[35%] right-[25%] w-3.5 h-3.5 rounded-full bg-primary/60 shadow-[0_0_12px_hsl(243_75%_59%/0.5)]" />
        {/* Mouth */}
        <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
      </div>
      {/* Scanning lines */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-scan-line shadow-[0_0_20px_hsl(243_75%_59%/0.6)]" />
      </div>
      {/* Corner brackets with glow */}
      <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary/70 rounded-tl-lg shadow-[0_0_10px_hsl(243_75%_59%/0.3)]" />
      <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary/70 rounded-tr-lg shadow-[0_0_10px_hsl(243_75%_59%/0.3)]" />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary/70 rounded-bl-lg shadow-[0_0_10px_hsl(243_75%_59%/0.3)]" />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary/70 rounded-br-lg shadow-[0_0_10px_hsl(243_75%_59%/0.3)]" />
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse shadow-[0_0_6px_hsl(243_75%_59%/0.4)]"
          style={{
            top: `${15 + Math.random() * 70}%`,
            left: `${15 + Math.random() * 70}%`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {/* Pulse rings */}
      <div className="absolute inset-0 rounded-full border border-primary/15 animate-pulse-ring" />
      <div className="absolute inset-4 rounded-full border border-primary/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
    </div>
  );
}

import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('token', response.data.access_token);
      // Fetch and store user profile
      try {
        const meRes = await authApi.me();
        localStorage.setItem('userName', meRes.data.name);
        localStorage.setItem('userEmail', meRes.data.email);
      } catch {}
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error.response?.data?.detail;
      const displayMessage = typeof errorMessage === 'string'
        ? errorMessage
        : Array.isArray(errorMessage)
          ? errorMessage[0]?.msg
          : "Login failed. Please check your credentials.";
      toast.error(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Rich gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-purple-500/5" />
      <div className="absolute inset-0 dot-pattern opacity-40" />

      {/* Floating gradient orbs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-primary/8 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/6 rounded-full blur-[120px] animate-float-delay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/4 rounded-full blur-[150px]" />

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center animate-fade-in relative z-10">
        {/* Illustration side */}
        <div className="hidden md:flex flex-col items-center justify-center gap-8">
          <FaceIllustration />
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-gradient">AI Face Recognition</h2>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Automated attendance powered by advanced facial recognition technology. Fast, accurate, and intelligent.
            </p>
          </div>
        </div>

        {/* Login form */}
        <Card className="glass-card card-glow">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Scan className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-extrabold text-xl text-gradient">AttendAI</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to your teacher dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-muted/50 border-border/60 focus:border-primary focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-input accent-primary" />
                  Remember me
                </label>
                <Button variant="link" className="px-0 text-sm h-auto text-primary" type="button">
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure login • 256-bit encryption
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
