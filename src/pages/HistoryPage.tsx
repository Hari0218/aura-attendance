import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, CalendarDays } from "lucide-react";
import { mockAttendanceHistory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Attendance History</h1>
              <p className="text-sm text-muted-foreground">View past attendance records</p>
            </div>
          </div>
          <Button variant="outline" className="font-medium" onClick={() => toast({ title: "📥 Report Downloaded" })}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Input type="date" className="w-auto bg-muted/50 border-border/60" />
              <Input type="date" className="w-auto bg-muted/50 border-border/60" />
              <Select>
                <SelectTrigger className="w-[140px] bg-muted/50 border-border/60"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS-301">CS-301</SelectItem>
                  <SelectItem value="CS-201">CS-201</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student..." className="pl-9 w-[200px] bg-muted/50 border-border/60" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="card-elevated overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Class</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Present</TableHead>
                  <TableHead className="font-semibold">Absent</TableHead>
                  <TableHead className="font-semibold">Rate</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttendanceHistory.map((row) => {
                  const rate = Math.round((row.present / row.total) * 100);
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm">{row.date}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-medium">{row.class}</Badge></TableCell>
                      <TableCell className="font-medium">{row.total}</TableCell>
                      <TableCell className="text-success font-semibold">{row.present}</TableCell>
                      <TableCell className="text-destructive font-semibold">{row.absent}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 font-semibold ${rate >= 90 ? "bg-success/10 text-success" : rate >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                          {rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast({ title: "📥 Report Downloaded" })}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
