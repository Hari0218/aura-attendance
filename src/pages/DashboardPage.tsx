import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { reportsApi, attendanceApi } from "@/lib/api";

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
      <div className="space-y-8 animate-fade-in">
        {/* Page title */}
        <div className="flex flex-col mb-8">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
          >
            Dashboard
          </h1>
          <p
            className="mt-1"
            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
          >
            Real-time attendance overview
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="card-elevated p-6 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {stat.title}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  {loading ? "..." : stat.value}
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(196,98,45,0.1)" }}
              >
                <stat.icon className="h-6 w-6" style={{ color: "#C4622D" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Today's Attendance List */}
        <div>
          <p
            className="section-label mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Today's Attendance
          </p>
          {todayRecords.length === 0 ? (
            <div className="card-elevated p-12 flex flex-col items-center justify-center text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#FDF6EE" }}
              >
                <Users className="h-8 w-8" style={{ color: "#7C5C4E" }} />
              </div>
              <p
                className="font-medium"
                style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
              >
                No records yet
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
              >
                Attendance data will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record: any, i: number) => (
                <div
                  key={i}
                  className="card-elevated p-4 flex items-center justify-between"
                  style={{ transition: "all 0.2s ease" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: "#FDF6EE", color: "#7C5C4E" }}
                    >
                      {(record.student_name || record.student_id).substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {record.student_name || record.student_id}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {record.roll_number || "ID UNKNOWN"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={record.status === "PRESENT" ? "badge-present" : "badge-absent"}
                  >
                    {record.status === "PRESENT" ? "PRESENT" : "ABSENT"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
