import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarDays, FileText } from "lucide-react";
import { attendanceApi, classroomApi } from "@/lib/api";
import { toast } from "sonner";

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  status: string;
  confidence: number;
  date: string;
}

interface Classroom {
  id: string;
  name: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
    loadHistory();
  }, []);

  const loadClassrooms = async () => {
    try {
      const res = await classroomApi.getAll();
      setClassrooms(res.data);
    } catch (err) {
      console.error("Failed to load classrooms:", err);
    }
  };

  const loadHistory = async (classId?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (classId) params.class_id = classId;
      const res = await attendanceApi.getHistory(params);
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassFilter = (value: string) => {
    setSelectedClass(value);
    if (value === "all") {
      loadHistory();
    } else {
      loadHistory(value);
    }
  };

  // Group records by date
  const groupedByDate = records.reduce<Record<string, AttendanceRecord[]>>((acc, r) => {
    const dateStr = new Date(r.date).toLocaleDateString('en-CA');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

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
              <p className="text-sm text-muted-foreground">{records.length} records</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedClass} onValueChange={handleClassFilter}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-border/60"><SelectValue placeholder="All Classrooms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records */}
        {loading ? (
          <div className="flex justify-center p-12"><div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : records.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No attendance records found</p>
              <p className="text-xs mt-1">Mark attendance first to see history here</p>
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dayRecords = groupedByDate[date];
            const present = dayRecords.filter((r) => r.status === "PRESENT").length;
            const absent = dayRecords.filter((r) => r.status === "ABSENT").length;
            const rate = dayRecords.length > 0 ? Math.round((present / dayRecords.length) * 100) : 0;

            return (
              <Card key={date} className="card-elevated overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{date}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-success/10 text-success border-0 font-semibold">{present} Present</Badge>
                      <Badge className="bg-destructive/10 text-destructive border-0 font-semibold">{absent} Absent</Badge>
                      <Badge className={`border-0 font-semibold ${rate >= 90 ? "bg-success/10 text-success" : rate >= 70 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                        {rate}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">Student</TableHead>
                        <TableHead className="font-semibold">Roll Number</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayRecords.map((r, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-sm">{r.student_name}</TableCell>
                          <TableCell><Badge variant="secondary" className="font-mono">{r.roll_number}</Badge></TableCell>
                          <TableCell>
                            <Badge className={`border-0 font-semibold ${r.status === "PRESENT" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.confidence > 0 ? `${(r.confidence * 100).toFixed(1)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
