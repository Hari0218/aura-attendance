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
    <Sidebar collapsible="icon" className="border-r border-gray-100 bg-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                AttendAI <span className="inline-block w-2 h-2 rounded-full bg-primary ml-0.5" />
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
                         className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden ${
                           isActive
                             ? "bg-primary/10 text-primary font-semibold"
                             : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                         }`}
                         activeClassName=""
                      >
                         {isActive && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                         )}
                         <div className={`shrink-0 z-10 ${isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-900"}`}>
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
          <div className="flex items-center gap-2 justify-center py-2 px-3 bg-primary/5 rounded-full border border-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary">AI Powered</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
