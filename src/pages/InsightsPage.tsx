import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Sparkles, Users } from "lucide-react";
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

const riskColors: Record<string, string> = {
  HIGH: "bg-destructive/10 text-destructive",
  MEDIUM: "bg-warning/10 text-warning",
  LOW: "bg-success/10 text-success",
};

export default function InsightsPage() {
  const [frequentlyAbsent, setFrequentlyAbsent] = useState<AbsentStudent[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [absentRes, riskRes] = await Promise.all([
        insightsApi.frequentlyAbsent(30, 3),
        insightsApi.riskAlerts(14),
      ]);
      setFrequentlyAbsent(absentRes.data);
      setRiskAlerts(riskRes.data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-lg shadow-primary/25 animate-gradient-shift">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              AI Insights
              <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground">Smart analytics powered by AI</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : (frequentlyAbsent.length === 0 && riskAlerts.length === 0) ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-semibold">No insights yet</p>
              <p className="text-sm mt-1">Add students to classrooms and start marking attendance to see AI insights here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frequently Absent */}
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Frequently Absent Students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {frequentlyAbsent.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No frequently absent students found</p>
                ) : (
                  frequentlyAbsent.map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 hover:bg-muted/30 transition-all">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{student.student_name}</p>
                        <p className="text-xs text-muted-foreground">{student.absent_count} absences in last 30 days ({Math.round(student.absence_rate * 100)}%)</p>
                      </div>
                      <Badge className="border-0 gap-1 font-semibold bg-destructive/10 text-destructive">
                        <TrendingUp className="h-3 w-3" />
                        {student.absent_count}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No risk alerts</p>
                ) : (
                  riskAlerts.map((alert) => (
                    <div key={alert.student_id} className="rounded-xl border border-border/50 p-3.5 space-y-2.5 hover:bg-muted/30 transition-all">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{alert.student_name}</p>
                        <Badge className={`border-0 font-semibold ${riskColors[alert.risk_level] || riskColors.LOW}`}>
                          {alert.risk_level.toLowerCase()} risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={alert.recent_absence_rate * 100} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground font-semibold w-10">
                          {Math.round(alert.recent_absence_rate * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
