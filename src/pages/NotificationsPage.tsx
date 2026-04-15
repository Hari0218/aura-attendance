import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, CheckCircle, Clock, XCircle, Bell, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { notificationApi, studentApi } from "@/lib/api";

const statusIcons: Record<string, any> = {
  SENT: CheckCircle,
  PENDING: Clock,
  FAILED: XCircle,
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  SENT: { bg: "#D1FAE5", text: "#065F46" },
  PENDING: { bg: "#FEF3C7", text: "#92400E" },
  FAILED: { bg: "#FEE2E2", text: "#991B1B" },
};

interface Notification {
  id: string;
  student_id: string;
  message: string;
  status: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingAbsent, setSendingAbsent] = useState(false);

  // Student name lookup map
  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, studentRes] = await Promise.all([
        notificationApi.getAll(),
        studentApi.getAll(),
      ]);
      setNotifications(notifRes.data);
      setStudents(studentRes.data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleSend = async () => {
    if (!selectedStudent || !message.trim()) {
      toast({ title: "⚠️ Please select a student and enter a message", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await notificationApi.send({ student_id: selectedStudent, message });
      toast({ title: "📨 Notification Sent" });
      setMessage("");
      setSelectedStudent("");
      loadData();
    } catch (err: any) {
      toast({ title: "❌ Failed to send", description: err.response?.data?.detail || "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAbsent = async () => {
    setSendingAbsent(true);
    try {
      const res = await notificationApi.sendAbsent();
      toast({ title: `📨 ${res.data.message}` });
      loadData();
    } catch (err: any) {
      toast({ title: "❌ Failed", description: err.response?.data?.detail || "Error", variant: "destructive" });
    } finally {
      setSendingAbsent(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "#FDF6EE",
    borderColor: "#EDE0D4",
    color: "#2C1810",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s ease",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(196,98,45,0.12)" }}
          >
            <Bell className="h-5 w-5" style={{ color: "#C4622D" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
            >
              Notifications
            </h1>
            <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
              Send alerts to students and parents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose */}
          <Card className="card-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle
                className="text-base font-semibold"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
              >
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  className="font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Recipient
                </Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger style={inputStyle}>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.roll_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  className="font-medium"
                  style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Message
                </Label>
                <Textarea
                  placeholder="Type your message..."
                  rows={4}
                  style={{ ...inputStyle, resize: "none" }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button
                className="w-full font-semibold border-0"
                style={{
                  background: "#C4622D",
                  color: "#fff",
                  borderRadius: "999px",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSend}
                disabled={loading}
              >
                <Send className="h-4 w-4 mr-2" /> {loading ? "Sending..." : "Send Notification"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: "#EDE0D4" }} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span
                    className="px-2"
                    style={{ background: "#fff", color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full font-semibold"
                style={{
                  borderColor: "#EDE0D4",
                  color: "#2C1810",
                  borderRadius: "999px",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
                onClick={handleSendAbsent}
                disabled={sendingAbsent}
              >
                <AlertTriangle className="h-4 w-4 mr-2" /> {sendingAbsent ? "Sending..." : "Notify All Absent Students"}
              </Button>
            </CardContent>
          </Card>

          {/* Log */}
          <Card className="card-elevated lg:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle
                className="text-base font-semibold"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#2C1810" }}
              >
                Notification Log ({notifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-10 w-10 mb-3 opacity-30" style={{ color: "#7C5C4E" }} />
                  <p
                    className="text-sm"
                    style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    No notifications sent yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader style={{ background: "#FDF6EE" }}>
                    <TableRow className="hover:bg-transparent">
                      {["Recipient", "Message", "Status", "Time"].map((h) => (
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
                    {notifications.map((n) => {
                      const StatusIcon = statusIcons[n.status] || Clock;
                      const style = statusStyles[n.status] || { bg: "#F5F5F5", text: "#7C5C4E" };
                      const studentName = studentMap.get(n.student_id) || n.student_id;
                      const timeStr = n.created_at ? new Date(n.created_at).toLocaleString() : "";
                      return (
                        <TableRow
                          key={n.id}
                          className="transition-colors"
                          style={{ borderColor: "#EDE0D4" }}
                        >
                          <TableCell
                            className="font-semibold text-sm"
                            style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {studentName}
                          </TableCell>
                          <TableCell
                            className="text-sm max-w-[200px] truncate"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {n.message}
                          </TableCell>
                          <TableCell>
                            <span
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
                              style={{ background: style.bg, color: style.text }}
                            >
                              <StatusIcon className="h-3 w-3" /> {n.status}
                            </span>
                          </TableCell>
                          <TableCell
                            className="text-xs"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {timeStr}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
