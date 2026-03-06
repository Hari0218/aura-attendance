import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, TrendingUp, TrendingDown, Activity, Bell as BellIcon, AlertTriangle, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { mockWeeklyData, mockMonthlyData, mockRecentActivity } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

const stats = [
  { title: "Total Students", value: "42", icon: Users, trend: "+3", trendUp: true, gradient: "from-primary/15 to-purple-500/10", iconBg: "gradient-primary", iconColor: "text-primary-foreground" },
  { title: "Present Today", value: "38", icon: UserCheck, trend: "+2", trendUp: true, gradient: "from-emerald-500/15 to-green-400/10", iconBg: "gradient-success", iconColor: "text-success-foreground" },
  { title: "Absent Today", value: "4", icon: UserX, trend: "-1", trendUp: false, gradient: "from-red-500/15 to-orange-400/10", iconBg: "gradient-warm", iconColor: "text-destructive-foreground" },
  { title: "Attendance %", value: "90.5%", icon: TrendingUp, trend: "+2.1%", trendUp: true, gradient: "from-primary/15 to-cyan-400/10", iconBg: "gradient-primary", iconColor: "text-primary-foreground" },
];

const activityIcons = {
  attendance: Activity,
  notification: BellIcon,
  alert: AlertTriangle,
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of today's attendance</p>
          </div>
          <Badge className="gradient-primary text-primary-foreground border-0 px-3 py-1 shadow-lg shadow-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary-foreground/80 animate-pulse mr-2" />
            Live
          </Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={stat.title} className={`card-elevated overflow-hidden group hover:card-glow transition-all duration-300`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${stat.trendUp ? "bg-success/10" : "bg-destructive/10"}`}>
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs font-semibold ${stat.trendUp ? "text-success" : "text-destructive"}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Weekly Attendance</CardTitle>
                <Badge variant="secondary" className="text-xs">This Week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mockWeeklyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 8px 30px hsl(var(--foreground) / 0.08)",
                    }}
                  />
                  <Bar dataKey="present" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(var(--destructive) / 0.7)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Monthly Trends</CardTitle>
                <Badge variant="secondary" className="text-xs">6 Months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={mockMonthlyData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 8px 30px hsl(var(--foreground) / 0.08)",
                    }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorRate)" dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))", r: 4 }} activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Badge variant="secondary" className="text-xs">Today</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockRecentActivity.map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <div key={activity.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-all duration-200 group cursor-pointer">
                    <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                      activity.type === "attendance" ? "bg-primary/10 text-primary" :
                      activity.type === "notification" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${
                      activity.type === "attendance" ? "bg-primary/5 text-primary" :
                      activity.type === "notification" ? "bg-warning/5 text-warning" :
                      "bg-destructive/5 text-destructive"
                    }`}>
                      {activity.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
