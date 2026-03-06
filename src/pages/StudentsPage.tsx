import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Upload, Users } from "lucide-react";
import { mockStudents } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const filtered = mockStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Students</h1>
              <p className="text-sm text-muted-foreground">{mockStudents.length} students enrolled</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle className="text-lg font-bold">Add New Student</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Student name" className="bg-muted/50" /></div>
                <div className="space-y-2"><Label>Roll Number</Label><Input placeholder="e.g. CS-013" className="bg-muted/50" /></div>
                <div className="space-y-2">
                  <Label>Face Image</Label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all">
                    <Upload className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Click to upload face image</p>
                  </div>
                </div>
                <Button className="w-full gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20" onClick={() => toast({ title: "✅ Student Added" })}>
                  Save Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9 bg-muted/50 border-border/60" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((student) => (
            <Card key={student.id} className="card-elevated hover:card-glow transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-foreground">{student.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{student.rollNumber}</p>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className={`text-xs font-semibold ${
                    student.attendancePercent >= 90 ? "bg-success/10 text-success" :
                    student.attendancePercent >= 75 ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {student.attendancePercent}% attendance
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
