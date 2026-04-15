import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText } from "lucide-react";
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(196,98,45,0.12)" }}
            >
              <CalendarDays className="h-5 w-5" style={{ color: "#C4622D" }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
              >
                Attendance History
              </h1>
              <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                {records.length} records
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedClass} onValueChange={handleClassFilter}>
                <SelectTrigger
                  className="w-[180px]"
                  style={{
                    background: "#FDF6EE",
                    borderColor: "#EDE0D4",
                    color: "#2C1810",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <SelectValue placeholder="All Classrooms" />
                </SelectTrigger>
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
          <div className="flex justify-center p-12">
            <div
              className="h-8 w-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "rgba(196,98,45,0.2)", borderTopColor: "#C4622D" }}
            />
          </div>
        ) : records.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 mb-3 opacity-30" style={{ color: "#7C5C4E" }} />
              <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                No attendance records found
              </p>
              <p className="text-xs mt-1" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                Mark attendance first to see history here
              </p>
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
                    <CardTitle
                      className="text-base font-semibold"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
                    >
                      {date}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="badge-present">{present} Present</span>
                      <span className="badge-absent">{absent} Absent</span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: rate >= 90 ? "#D1FAE5" : rate >= 70 ? "#FEF3C7" : "#FEE2E2",
                          color: rate >= 90 ? "#065F46" : rate >= 70 ? "#92400E" : "#991B1B",
                        }}
                      >
                        {rate}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader style={{ background: "#FDF6EE" }}>
                      <TableRow className="hover:bg-transparent">
                        {["Student", "Roll Number", "Status", "Confidence"].map((h) => (
                          <TableHead
                            key={h}
                            className="font-semibold"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayRecords.map((r, i) => (
                        <TableRow
                          key={i}
                          className="transition-colors"
                          style={{ borderColor: "#EDE0D4" }}
                        >
                          <TableCell
                            className="font-semibold text-sm"
                            style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {r.student_name}
                          </TableCell>
                          <TableCell>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold font-mono"
                              style={{ background: "rgba(196,98,45,0.08)", color: "#7C5C4E" }}
                            >
                              {r.roll_number}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={r.status === "PRESENT" ? "badge-present" : "badge-absent"}>
                              {r.status}
                            </span>
                          </TableCell>
                          <TableCell
                            className="text-sm"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
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
