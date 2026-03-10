import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { reportsApi, attendanceApi } from "@/lib/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchToday();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await reportsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToday = async () => {
    try {
      const res = await attendanceApi.getToday();
      setTodayRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch today:", err);
    }
  };

  const presentToday = todayRecords.filter((r) => r.status === "PRESENT").length;
  const absentToday = todayRecords.filter((r) => r.status === "ABSENT").length;
  const totalStudents = stats?.total_students || 0;
  const attendanceRate = totalStudents > 0 && (presentToday + absentToday) > 0
    ? Math.round((presentToday / (presentToday + absentToday)) * 100)
    : 0;

  const statCards = [
    { title: "Total Students", value: totalStudents, icon: Users, gradient: "from-primary/15 to-purple-500/10", iconBg: "gradient-primary", iconColor: "text-primary-foreground" },
    { title: "Present Today", value: presentToday, icon: UserCheck, gradient: "from-emerald-500/15 to-green-400/10", iconBg: "gradient-success", iconColor: "text-success-foreground" },
    { title: "Absent Today", value: absentToday, icon: UserX, gradient: "from-red-500/15 to-orange-400/10", iconBg: "gradient-warm", iconColor: "text-destructive-foreground" },
    { title: "Attendance %", value: `${attendanceRate}%`, icon: TrendingUp, gradient: "from-primary/15 to-cyan-400/10", iconBg: "gradient-primary", iconColor: "text-primary-foreground" },
  ];

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
          {statCards.map((stat) => (
            <Card key={stat.title} className="card-elevated overflow-hidden group hover:card-glow transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-3xl font-extrabold text-foreground">{loading ? "..." : stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Attendance List */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No attendance recorded today</p>
                <p className="text-xs mt-1 text-muted-foreground">Upload a classroom photo to mark attendance</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayRecords.map((record: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${record.status === "PRESENT" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {record.status === "PRESENT" ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.student_name || record.student_id}</p>
                        <p className="text-xs text-muted-foreground">{record.roll_number || ""}</p>
                      </div>
                    </div>
                    <Badge className={`border-0 font-semibold ${record.status === "PRESENT" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
