import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const statusColors: Record<string, string> = {
  SENT: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  FAILED: "bg-destructive/10 text-destructive",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Bell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">Send alerts to students and parents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose */}
          <Card className="card-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Send Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Recipient</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="bg-muted/50 border-border/60"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.roll_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Message</Label>
                <Textarea
                  placeholder="Type your message..."
                  rows={4}
                  className="bg-muted/50 border-border/60 resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20"
                onClick={handleSend}
                disabled={loading}
              >
                <Send className="h-4 w-4 mr-2" /> {loading ? "Sending..." : "Send Notification"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>

              <Button
                variant="outline"
                className="w-full font-semibold"
                onClick={handleSendAbsent}
                disabled={sendingAbsent}
              >
                <AlertTriangle className="h-4 w-4 mr-2" /> {sendingAbsent ? "Sending..." : "Notify All Absent Students"}
              </Button>
            </CardContent>
          </Card>

          {/* Log */}
          <Card className="card-elevated lg:col-span-2 overflow-hidden">
            <CardHeader><CardTitle className="text-base font-semibold">Notification Log ({notifications.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">No notifications sent yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Recipient</TableHead>
                      <TableHead className="font-semibold">Message</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((n) => {
                      const StatusIcon = statusIcons[n.status] || Clock;
                      const colorClass = statusColors[n.status] || "bg-muted/10 text-muted-foreground";
                      const studentName = studentMap.get(n.student_id) || n.student_id;
                      const timeStr = n.created_at ? new Date(n.created_at).toLocaleString() : "";
                      return (
                        <TableRow key={n.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-sm">{studentName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{n.message}</TableCell>
                          <TableCell>
                            <Badge className={`border-0 gap-1 font-semibold ${colorClass}`}>
                              <StatusIcon className="h-3 w-3" /> {n.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{timeStr}</TableCell>
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
