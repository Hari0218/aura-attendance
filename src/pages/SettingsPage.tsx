import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useThemeContext } from "@/components/ThemeProvider";
import { Save, Moon, Bell, Shield, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeContext();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("userName") || "");
    setEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const inputStyle: React.CSSProperties = {
    background: "#FDF6EE",
    borderColor: "#EDE0D4",
    color: "#2C1810",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s ease",
  };

  const pref = (icon: React.ReactNode, title: string, desc: string, control: React.ReactNode, bg: string, iconColor: string) => (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: bg }}
          >
            <span style={{ color: iconColor }}>{icon}</span>
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
            >
              {title}
            </p>
            <p
              className="text-xs"
              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
            >
              {desc}
            </p>
          </div>
        </div>
        {control}
      </div>
      <Separator style={{ borderColor: "#EDE0D4" }} />
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(196,98,45,0.12)" }}
          >
            <Settings className="h-5 w-5" style={{ color: "#C4622D" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
            >
              Settings
            </h1>
            <p
              className="text-sm"
              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
            >
              Manage your profile and preferences
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="card-elevated overflow-hidden">
          <div className="h-20" style={{ background: "linear-gradient(135deg, #C4622D 0%, #D4784A 100%)" }} />
          <CardContent className="space-y-4 -mt-10 relative">
            <div className="flex items-end gap-4">
              <Avatar
                className="h-20 w-20 shadow-xl"
                style={{ outline: "4px solid #fff" }}
              >
                <AvatarFallback
                  className="text-xl font-bold"
                  style={{ background: "#C4622D", color: "#fff" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <p
                  className="font-bold text-lg"
                  style={{ color: "#2C1810", fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {name || "Teacher"}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {email}
                </p>
              </div>
            </div>
            <Separator style={{ borderColor: "#EDE0D4" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  className="font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Full Name
                </Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>
              <div className="space-y-2">
                <Label
                  className="font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Email
                </Label>
                <Input value={email} readOnly style={{ ...inputStyle, opacity: 0.7 }} />
              </div>
            </div>
            <Button
              className="font-semibold border-0"
              style={{
                background: "#C4622D",
                color: "#fff",
                borderRadius: "999px",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                localStorage.setItem("userName", name);
                toast({ title: "✅ Profile Updated" });
              }}
            >
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle
              className="text-base font-semibold"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
            >
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {pref(
              <Moon className="h-4 w-4" />,
              "Dark Mode",
              "Toggle dark theme",
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />,
              "rgba(196,98,45,0.1)",
              "#C4622D"
            )}
            {pref(
              <Bell className="h-4 w-4" />,
              "Email Notifications",
              "Receive attendance alerts via email",
              <Switch defaultChecked />,
              "#FEF3C7",
              "#d97706"
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#D1FAE5" }}
                >
                  <Shield className="h-4 w-4" style={{ color: "#059669" }} />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Two-Factor Authentication
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Add extra security to your account
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
