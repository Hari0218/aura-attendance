import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { authApi, authStorage } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
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

  const handleLogout = () => {
    authStorage.clearSession();
    navigate("/login");
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 border-b"
      style={{
        background: "#FDF6EE",
        borderColor: "#EDE0D4",
        transition: "all 0.2s ease",
      }}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className="transition-colors"
          style={{ color: "#7C5C4E" }}
        >
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl transition-all duration-200"
          style={{ color: "#7C5C4E" }}
          onClick={() => navigate("/notifications")}
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-all duration-200 ml-1"
          style={{ color: "#2C1810" }}
        >
          <Avatar
            className="h-8 w-8"
            style={{ outline: "2px solid #EDE0D4" }}
          >
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: "#C4622D", color: "#fff" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>
              {userName || "Teacher"}
            </p>
            <p className="text-xs" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>Teacher</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold transition-all duration-200"
          style={{
            borderColor: "#EDE0D4",
            background: "#fff",
            color: "#C4622D",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
