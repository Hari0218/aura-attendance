import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Scan } from "lucide-react";
import { authApi, authStorage } from "@/lib/api";
import { toast } from "sonner";

function AttendanceIllustration() {
  return (
    <>
      <style>{`
        @keyframes scanSweep {
          0%   { top: 15%; opacity: 0.8; }
          48%  { top: 82%; opacity: 0.8; }
          50%  { top: 82%; opacity: 0;   }
          51%  { top: 15%; opacity: 0;   }
          52%  { top: 15%; opacity: 0.8; }
          100% { top: 15%; opacity: 0.8; }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 0.5;  transform: scale(1.04); }
        }
      `}</style>
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Outer soft ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(196,98,45,0.12) 0%, rgba(196,98,45,0.03) 70%, transparent 100%)",
          }}
        />
        {/* Middle ring — subtle pulse */}
        <div
          className="absolute inset-8 rounded-full border-2"
          style={{
            borderColor: "rgba(196,98,45,0.25)",
            animation: "pulseRing 3s ease-in-out infinite",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-16 rounded-full border"
          style={{ borderColor: "rgba(196,98,45,0.15)" }}
        />
        {/* Corner brackets — top-left */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: "rgba(196,98,45,0.5)" }} />
        {/* top-right */}
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: "rgba(196,98,45,0.5)" }} />
        {/* bottom-left */}
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: "rgba(196,98,45,0.5)" }} />
        {/* bottom-right */}
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: "rgba(196,98,45,0.5)" }} />

        {/* ── Scanner sweep line ── */}
        <div
          className="absolute left-6 right-6 pointer-events-none z-20"
          style={{
            height: "2px",
            animation: "scanSweep 2.8s ease-in-out infinite",
            background: "linear-gradient(90deg, transparent, rgba(196,98,45,0.9), transparent)",
            boxShadow: "0 0 8px 3px rgba(196,98,45,0.45)",
            borderRadius: "9999px",
          }}
        />

        {/* Center icon */}
        <div
          className="relative z-10 h-20 w-20 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: "rgba(196,98,45,0.1)", border: "1.5px solid rgba(196,98,45,0.3)" }}
        >
          <Scan className="h-9 w-9" style={{ color: "#C4622D" }} />
        </div>

        {/* Dots */}
        {[
          { top: "22%", left: "18%" },
          { top: "22%", right: "18%", left: "auto" },
          { bottom: "22%", left: "50%", transform: "translateX(-50%)" },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: "rgba(196,98,45,0.5)", ...pos }}
          />
        ))}
      </div>
    </>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard";

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      authStorage.setSession(response.data.access_token);
      try {
        const meRes = await authApi.me();
        authStorage.setSession(response.data.access_token, {
          name: meRes.data.name,
          email: meRes.data.email,
        });
      } catch {
        // Session token is enough to continue if profile fetch fails.
      }
      toast.success("Login successful!");
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error.response?.data?.detail;
      const displayMessage = typeof errorMessage === "string"
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#FDF6EE" }}
    >
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center animate-fade-in">

        {/* Left panel — illustration */}
        <div className="hidden md:flex flex-col items-center justify-center gap-8">
          <AttendanceIllustration />
          <div className="text-center space-y-2">
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "#2C1810",
              }}
            >
              AI Face Recognition
            </h2>
            <p
              className="text-sm max-w-xs leading-relaxed"
              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
            >
              Automated attendance powered by advanced facial recognition technology. Fast, accurate, and intelligent.
            </p>
          </div>
        </div>

        {/* Right panel — login card */}
        <Card
          className="border"
          style={{
            background: "#FFFFFF",
            borderColor: "#EDE0D4",
            borderRadius: "16px",
            boxShadow: "0 2px 16px rgba(196, 98, 45, 0.07)",
          }}
        >
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "#C4622D" }}
              >
                <Scan className="h-5 w-5 text-white" />
              </div>
              <span
                className="font-bold text-xl"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "#2C1810",
                }}
              >
                AttendAI
              </span>
            </div>
            <CardTitle
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "#2C1810",
              }}
            >
              Welcome back
            </CardTitle>
            <CardDescription style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
              Sign in to your teacher dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    height: "44px",
                    background: "#FDF6EE",
                    borderColor: "#EDE0D4",
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#2C1810",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="········"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      height: "44px",
                      background: "#FDF6EE",
                      borderColor: "#EDE0D4",
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#2C1810",
                      transition: "all 0.2s ease",
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    style={{ color: "#7C5C4E" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <input type="checkbox" className="rounded border-input" style={{ accentColor: "#C4622D" }} />
                  Remember me
                </label>
                <Button
                  variant="link"
                  className="px-0 text-sm h-auto"
                  style={{ color: "#C4622D", fontFamily: "'DM Sans', sans-serif" }}
                  type="button"
                >
                  Forgot password?
                </Button>
              </div>
              <Button
                type="submit"
                className="w-full font-semibold border-0"
                style={{
                  height: "44px",
                  background: "#C4622D",
                  color: "#ffffff",
                  borderRadius: "999px",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p
                className="text-center text-xs"
                style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
              >
                Secure login · 256-bit encryption
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
