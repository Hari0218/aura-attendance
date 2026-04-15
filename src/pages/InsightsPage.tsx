import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, Brain, Sparkles, Users } from "lucide-react";
import { insightsApi } from "@/lib/api";

interface AbsentStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  absent_count: number;
  total_days: number;
  absence_rate: number;
}

interface RiskAlert {
  student_id: string;
  student_name: string;
  roll_number: string;
  risk_level: string;
  recent_absence_rate: number;
  message: string;
}

interface AttendanceSummaryStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  class_name: string;
  present_count: number;
  absent_count: number;
  total_count: number;
  attendance_rate: number;
}

const riskColors: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "#FEE2E2", text: "#991B1B" },
  MEDIUM: { bg: "#FEF3C7", text: "#92400E" },
  LOW: { bg: "#D1FAE5", text: "#065F46" },
};

const FILTER_TABS = [
  { key: "all", label: "All Students" },
  { key: "above90", label: "Above 90%" },
  { key: "75to90", label: "75% – 90%" },
  { key: "below75", label: "Below 75%" },
];

function getAttendanceColor(rate: number): { bar: string; bg: string; text: string } {
  if (rate >= 90) return { bar: "#059669", bg: "#D1FAE5", text: "#065F46" };
  if (rate >= 75) return { bar: "#d97706", bg: "#FEF3C7", text: "#92400E" };
  return { bar: "#ef4444", bg: "#FEE2E2", text: "#991B1B" };
}

export default function InsightsPage() {
  const [frequentlyAbsent, setFrequentlyAbsent] = useState<AbsentStudent[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [summaryStudents, setSummaryStudents] = useState<AttendanceSummaryStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [absentRes, riskRes, summaryRes] = await Promise.all([
        insightsApi.frequentlyAbsent(30, 3),
        insightsApi.riskAlerts(14),
        insightsApi.attendanceSummary(),
      ]);
      setFrequentlyAbsent(absentRes.data);
      setRiskAlerts(riskRes.data);
      setSummaryStudents(summaryRes.data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = summaryStudents.filter((s) => {
    if (activeFilter === "above90") return s.attendance_rate >= 90;
    if (activeFilter === "75to90") return s.attendance_rate >= 75 && s.attendance_rate < 90;
    if (activeFilter === "below75") return s.attendance_rate < 75;
    return true; // "all"
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(196,98,45,0.12)" }}
          >
            <Brain className="h-5 w-5" style={{ color: "#C4622D" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
            >
              AI Insights
              <Sparkles className="h-5 w-5" style={{ color: "#C4622D" }} />
            </h1>
            <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
              Smart analytics powered by AI
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div
              className="h-8 w-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "rgba(196,98,45,0.2)", borderTopColor: "#C4622D" }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ---- Attendance Summary with filter ---- */}
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle
                    className="text-base flex items-center gap-2 font-semibold"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(196,98,45,0.1)" }}
                    >
                      <Users className="h-4 w-4" style={{ color: "#C4622D" }} />
                    </div>
                    Attendance Summary
                  </CardTitle>
                  {/* Filter tabs */}
                  <div
                    className="flex items-center gap-1 p-1 rounded-full"
                    style={{ background: "#FDF6EE", border: "1px solid #EDE0D4" }}
                  >
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                        style={{
                          background: activeFilter === tab.key ? "#C4622D" : "transparent",
                          color: activeFilter === tab.key ? "#fff" : "#7C5C4E",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {summaryStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Users className="h-10 w-10 mb-3 opacity-20" style={{ color: "#7C5C4E" }} />
                    <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                      No attendance data yet. Mark attendance first.
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                      No students in this category.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => {
                      const colors = getAttendanceColor(student.attendance_rate);
                      return (
                        <div
                          key={student.student_id}
                          className="flex items-center gap-4 p-3 rounded-xl border"
                          style={{ borderColor: "#EDE0D4" }}
                        >
                          {/* Avatar */}
                          <div
                            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {student.student_name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                          </div>
                          {/* Name and class */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <p className="text-sm font-semibold truncate" style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>
                                  {student.student_name}
                                </p>
                                <p className="text-xs" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                                  {student.roll_number} · {student.class_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-3 shrink-0">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: colors.text, fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {student.attendance_rate}%
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: colors.bg, color: colors.text }}
                                >
                                  {student.present_count}/{student.total_count}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${student.attendance_rate}%`, background: colors.bar }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---- 2-column risk section ---- */}
            {(frequentlyAbsent.length > 0 || riskAlerts.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Frequently Absent */}
                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle
                      className="text-base flex items-center gap-2 font-semibold"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
                    >
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                        <AlertTriangle className="h-4 w-4" style={{ color: "#d97706" }} />
                      </div>
                      Frequently Absent Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {frequentlyAbsent.length === 0 ? (
                      <p className="text-sm text-center py-6" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                        No frequently absent students
                      </p>
                    ) : (
                      frequentlyAbsent.map((student) => (
                        <div
                          key={student.student_id}
                          className="flex items-center justify-between rounded-xl border p-3.5"
                          style={{ borderColor: "#EDE0D4", background: "#fff" }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>
                              {student.student_name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                              {student.absent_count} absences · {student.absence_rate}% absence rate
                            </p>
                          </div>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                            <TrendingUp className="h-3 w-3" />
                            {student.absent_count}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Risk Alerts */}
                <Card className="card-elevated">
                  <CardHeader className="pb-3">
                    <CardTitle
                      className="text-base flex items-center gap-2 font-semibold"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
                    >
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(196,98,45,0.1)" }}>
                        <Brain className="h-4 w-4" style={{ color: "#C4622D" }} />
                      </div>
                      Risk Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {riskAlerts.length === 0 ? (
                      <p className="text-sm text-center py-6" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                        No risk alerts
                      </p>
                    ) : (
                      riskAlerts.map((alert) => {
                        const colors = riskColors[alert.risk_level] || riskColors.LOW;
                        return (
                          <div
                            key={alert.student_id}
                            className="rounded-xl border p-3.5 space-y-2.5"
                            style={{ borderColor: "#EDE0D4", background: "#fff" }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold" style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>
                                {alert.student_name}
                              </p>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: colors.bg, color: colors.text }}>
                                {alert.risk_level.toLowerCase()} risk
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={alert.recent_absence_rate} className="h-2 flex-1" />
                              <span className="text-xs font-semibold w-10" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                                {Math.round(alert.recent_absence_rate)}%
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                              {alert.message}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
