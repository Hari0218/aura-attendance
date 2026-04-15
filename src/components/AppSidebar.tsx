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
    <Sidebar
      collapsible="icon"
      style={{
        background: "#FDF6EE",
        borderRight: "1px solid #EDE0D4",
      }}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(196,98,45,0.12)", color: "#C4622D" }}
          >
            <Camera className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span
                className="text-xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "#2C1810",
                }}
              >
                AttendAI{" "}
                <span
                  className="inline-block w-2 h-2 rounded-full ml-0.5"
                  style={{ background: "#C4622D" }}
                />
              </span>
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
                        className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 overflow-hidden transition-all duration-200"
                        style={{
                          background: isActive ? "rgba(196,98,45,0.09)" : "transparent",
                          color: isActive ? "#C4622D" : "#7C5C4E",
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: isActive ? 600 : 400,
                        }}
                        activeClassName=""
                      >
                        {isActive && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md"
                            style={{ background: "#C4622D" }}
                          />
                        )}
                        <div
                          className="shrink-0 z-10"
                          style={{ color: isActive ? "#C4622D" : "#7C5C4E" }}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                        {!collapsed && <span className="z-10">{item.title}</span>}
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
          <div
            className="flex items-center gap-2 justify-center py-2 px-3 rounded-full border"
            style={{
              background: "rgba(196,98,45,0.06)",
              borderColor: "rgba(196,98,45,0.2)",
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: "#C4622D" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "#C4622D", fontFamily: "'DM Sans', sans-serif" }}
            >
              AI Powered
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
