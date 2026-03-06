import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Brain, BarChart3, Sparkles } from "lucide-react";
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
              {mockInsights.frequentlyAbsent.map((student) => (
                <div key={student.name} className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 hover:bg-muted/30 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.absences} absences this semester</p>
                  </div>
                  <Badge className={`border-0 gap-1 font-semibold ${student.trend === "increasing" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {student.trend === "increasing" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {student.trend}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Predictions */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                Attendance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInsights.predictions.map((p) => (
                <div key={p.name} className="rounded-xl border border-border/50 p-3.5 space-y-2.5 hover:bg-muted/30 transition-all">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <Badge className={`border-0 font-semibold ${riskColors[p.risk]}`}>{p.risk} risk</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={p.probability} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground font-semibold w-8">{p.probability}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Probability of missing next class</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Class Trends */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                Class Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInsights.classTrends.map((c) => (
                <div key={c.className} className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 hover:bg-muted/30 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.className}</p>
                    <p className="text-xs text-muted-foreground">Current: {c.currentRate}% | Previous: {c.previousRate}%</p>
                  </div>
                  <Badge className={`border-0 gap-1 font-semibold ${c.change >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {c.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.change > 0 ? "+" : ""}{c.change}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly chart */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Attendance Rate Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mockMonthlyData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))", boxShadow: "0 8px 30px hsl(var(--foreground) / 0.08)" }} />
                  <Bar dataKey="rate" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
