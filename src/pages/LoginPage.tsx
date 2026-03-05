import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Scan } from "lucide-react";

function FaceIllustration() {
  return (
    <div className="relative w-64 h-64">
      {/* Face outline */}
      <div className="absolute inset-8 rounded-full border-2 border-primary/30 animate-float">
        <div className="absolute inset-4 rounded-full border border-primary/20" />
        {/* Eyes */}
        <div className="absolute top-[35%] left-[25%] w-3 h-3 rounded-full bg-primary/50" />
        <div className="absolute top-[35%] right-[25%] w-3 h-3 rounded-full bg-primary/50" />
        {/* Mouth */}
        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary/30" />
      </div>
      {/* Scanning lines */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
      </div>
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary/60 rounded-tl" />
      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary/60 rounded-tr" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary/60 rounded-bl" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary/60 rounded-br" />
      {/* Dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Pulse rings */}
      <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse-ring" />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Floating shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-float-delay" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center animate-fade-in">
        {/* Illustration side */}
        <div className="hidden md:flex flex-col items-center justify-center gap-6">
          <FaceIllustration />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">AI Face Recognition</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Automated attendance powered by advanced facial recognition technology
            </p>
          </div>
        </div>

        {/* Login form */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Scan className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">AttendAI</span>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your teacher dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                  <input type="checkbox" className="rounded border-input" />
                  Remember me
                </label>
                <Button variant="link" className="px-0 text-sm h-auto" type="button">
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
