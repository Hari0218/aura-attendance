import {
  LayoutDashboard,
  Camera,
  Users,
  CalendarDays,
  Bell,
  Brain,
  Settings,
  School,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mark Attendance", url: "/mark-attendance", icon: Camera },
  { title: "Classrooms", url: "/classrooms", icon: School },
  { title: "Students", url: "/students", icon: Users },
  { title: "History", url: "/history", icon: CalendarDays },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "AI Insights", url: "/insights", icon: Brain },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-gradient">AttendAI</span>
              <span className="text-xs text-muted-foreground">Smart Attendance</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <div className={`shrink-0 ${isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" : ""}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {!collapsed && <span>{item.title}</span>}
                        {isActive && !collapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success)/0.5)] animate-pulse" />
              <p className="text-xs font-semibold text-foreground">AI-Powered</p>
            </div>
            <p className="text-xs text-muted-foreground">Face Recognition v2.1</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
