import { Bell, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useThemeContext } from "@/components/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { theme, toggleTheme } = useThemeContext();
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get user name from localStorage first
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    } else {
      // Fetch from API
      authApi.me().then((res) => {
        setUserName(res.data.name);
        localStorage.setItem("userName", res.data.name);
      }).catch(() => {});
    }
  }, []);

  const initials = userName
    ? userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 px-4 glass">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/80 transition-all">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/80 transition-all"
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted/80 cursor-pointer transition-all duration-200 ml-1">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="gradient-primary text-xs text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{userName || "Teacher"}</p>
            <p className="text-xs text-muted-foreground">Teacher</p>
          </div>
        </div>
      </div>
    </header>
  );
}
