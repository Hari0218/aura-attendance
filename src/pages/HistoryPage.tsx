import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { mockAttendanceHistory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance History</h1>
            <p className="text-sm text-muted-foreground">View past attendance records</p>
          </div>
          <Button variant="outline" onClick={() => toast({ title: "Report Downloaded" })}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Input type="date" className="w-auto" />
              <Input type="date" className="w-auto" />
              <Select>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS-301">CS-301</SelectItem>
                  <SelectItem value="CS-201">CS-201</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student..." className="pl-9 w-[200px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttendanceHistory.map((row) => {
                  const rate = Math.round((row.present / row.total) * 100);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell><Badge variant="secondary">{row.class}</Badge></TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell className="text-success font-medium">{row.present}</TableCell>
                      <TableCell className="text-destructive font-medium">{row.absent}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 ${rate >= 90 ? "bg-success/10 text-success" : rate >= 80 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                          {rate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Report Downloaded" })}>
                          <Download className="h-3 w-3" />
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
