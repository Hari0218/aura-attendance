import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { reportsApi, attendanceApi } from "@/lib/api";
import { motion } from "framer-motion";

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
    { title: "Total Students", value: totalStudents, icon: Users },
    { title: "Present Today", value: presentToday, icon: UserCheck },
    { title: "Absent Today", value: absentToday, icon: UserX },
    { title: "Attendance", value: `${attendanceRate}%`, icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time attendance overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className="card-elevated p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : stat.value}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Today's Attendance List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Attendance</h2>
          {todayRecords.length === 0 ? (
            <div className="card-elevated p-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium">No records yet</p>
              <p className="text-gray-500 text-sm mt-1">Attendance data will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record: any, i: number) => (
                <div 
                  key={i} 
                  className="card-elevated p-4 flex items-center justify-between hover:border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                      {(record.student_name || record.student_id).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{record.student_name || record.student_id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{record.roll_number || "ID UNKNOWN"}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    record.status === "PRESENT" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {record.status === "PRESENT" ? "PRESENT" : "ABSENT"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
