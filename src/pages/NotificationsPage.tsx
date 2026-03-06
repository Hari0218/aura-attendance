import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, CheckCircle, Clock, XCircle, Bell } from "lucide-react";
import { mockNotifications } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const statusIcons = {
  delivered: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

const statusColors = {
  delivered: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
};

export default function NotificationsPage() {
  const { toast } = useToast();

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
                <Select>
                  <SelectTrigger className="bg-muted/50 border-border/60"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Absent Students</SelectItem>
                    <SelectItem value="vikram">Vikram Joshi</SelectItem>
                    <SelectItem value="rahul">Rahul Singh</SelectItem>
                    <SelectItem value="rohan">Rohan Desai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Type</Label>
                <Select>
                  <SelectTrigger className="bg-muted/50 border-border/60"><SelectValue placeholder="Notification type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absence">Absence Alert</SelectItem>
                    <SelectItem value="parent">Parent Notification</SelectItem>
                    <SelectItem value="report">Weekly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Message</Label>
                <Textarea placeholder="Type your message..." rows={4} className="bg-muted/50 border-border/60 resize-none" />
              </div>
              <Button className="w-full gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20" onClick={() => toast({ title: "📨 Notification Sent" })}>
                <Send className="h-4 w-4 mr-2" /> Send Notification
              </Button>
            </CardContent>
          </Card>

          {/* Log */}
          <Card className="card-elevated lg:col-span-2 overflow-hidden">
            <CardHeader><CardTitle className="text-base font-semibold">Notification Log</CardTitle></CardHeader>
            <CardContent className="p-0">
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
                  {mockNotifications.map((n) => {
                    const StatusIcon = statusIcons[n.status];
                    return (
                      <TableRow key={n.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-sm">{n.recipient}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{n.message}</TableCell>
                        <TableCell>
                          <Badge className={`border-0 gap-1 font-semibold ${statusColors[n.status]}`}>
                            <StatusIcon className="h-3 w-3" /> {n.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{n.time}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
