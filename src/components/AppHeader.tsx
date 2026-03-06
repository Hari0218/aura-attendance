import { Bell, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useThemeContext } from "@/components/ThemeProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const { theme, toggleTheme } = useThemeContext();

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

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/80 transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-4.5 w-4.5 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-background">
            3
          </span>
        </Button>

        <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted/80 cursor-pointer transition-all duration-200 ml-1">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="gradient-primary text-xs text-primary-foreground font-bold">
              DP
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-tight">Dr. Priya</p>
            <p className="text-xs text-muted-foreground">Teacher</p>
          </div>
        </div>
      </div>
    </header>
  );
}
