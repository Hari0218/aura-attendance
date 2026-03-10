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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Profile */}
        <Card className="card-elevated overflow-hidden">
          <div className="h-20 gradient-primary opacity-80" />
          <CardContent className="space-y-4 -mt-10 relative">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <p className="font-bold text-lg text-foreground">{name || "Teacher"}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-medium">Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/50 border-border/60" /></div>
              <div className="space-y-2"><Label className="font-medium">Email</Label><Input value={email} readOnly className="bg-muted/50 border-border/60" /></div>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20" onClick={() => { localStorage.setItem("userName", name); toast({ title: "✅ Profile Updated" }); }}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base font-semibold">Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Moon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive attendance alerts via email</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
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
