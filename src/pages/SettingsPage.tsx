import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useThemeContext } from "@/components/ThemeProvider";
import { Save, Moon, Bell, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeContext();
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="gradient-primary text-primary-foreground text-lg font-bold">DP</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">Dr. Priya Sharma</p>
                <p className="text-sm text-muted-foreground">Computer Science Department</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="Dr. Priya Sharma" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="priya@school.edu" /></div>
              <div className="space-y-2"><Label>Department</Label><Input defaultValue="Computer Science" /></div>
              <div className="space-y-2"><Label>Employee ID</Label><Input defaultValue="TCH-042" /></div>
            </div>
            <Button className="gradient-primary text-primary-foreground border-0" onClick={() => toast({ title: "Profile Updated" })}>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive attendance alerts via email</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
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
