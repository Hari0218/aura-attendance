import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Brain, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockInsights, mockMonthlyData } from "@/lib/mock-data";

const riskColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
            <p className="text-sm text-muted-foreground">Smart analytics powered by AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequently Absent */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Frequently Absent Students
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInsights.frequentlyAbsent.map((student) => (
                <div key={student.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.absences} absences this semester</p>
                  </div>
                  <Badge className={`border-0 gap-1 ${student.trend === "increasing" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {student.trend === "increasing" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {student.trend}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Predictions */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Attendance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInsights.predictions.map((p) => (
                <div key={p.name} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <Badge className={`border-0 ${riskColors[p.risk]}`}>{p.risk} risk</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={p.probability} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{p.probability}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Probability of missing next class</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Class Trends */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Class Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInsights.classTrends.map((c) => (
                <div key={c.className} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.className}</p>
                    <p className="text-xs text-muted-foreground">Current: {c.currentRate}% | Previous: {c.previousRate}%</p>
                  </div>
                  <Badge className={`border-0 gap-1 ${c.change >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {c.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.change > 0 ? "+" : ""}{c.change}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly chart */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Rate Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mockMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
