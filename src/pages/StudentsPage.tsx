import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Upload, Users } from "lucide-react";
import { classroomApi, studentApi } from "@/lib/api";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  roll_number: string;
  class_id: string;
}

interface Classroom {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ name: "", rollNumber: "", classId: "" });
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([loadClassrooms(), fetchStudents()]);
  };

  const loadClassrooms = async () => {
    try {
      const response = await classroomApi.getAll();
      setClassrooms(response.data);
      if (response.data.length > 0) {
        setNewStudent((current) => ({
          ...current,
          classId: current.classId || response.data[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load classrooms:", error);
      toast.error("Failed to load classrooms");
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentApi.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.rollNumber || !newStudent.classId) {
      toast.error("Please fill in the required fields");
      return;
    }

    setIsAdding(true);
    try {
      const response = await studentApi.create({
        name: newStudent.name,
        roll_number: newStudent.rollNumber,
        class_id: newStudent.classId,
      });

      if (faceImage) {
        await studentApi.uploadFace(response.data.id, faceImage);
      }

      toast.success("Student added successfully");
      setNewStudent({ name: "", rollNumber: "", classId: newStudent.classId });
      setFaceImage(null);
      await fetchStudents();
    } catch (error: any) {
      console.error("Failed to add student:", error);
      toast.error(error.response?.data?.detail || "Failed to add student");
    } finally {
      setIsAdding(false);
    }
  };

  const filtered = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(search.toLowerCase())
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
              <p className="text-sm text-muted-foreground">{students.length} students enrolled</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Student name"
                    className="bg-muted/50"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input
                    placeholder="e.g. AIDS-A-013"
                    className="bg-muted/50"
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classroom</Label>
                  <Select
                    value={newStudent.classId}
                    onValueChange={(value) => setNewStudent({ ...newStudent, classId: value })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Face Image</Label>
                  <div
                    className={`border-2 border-dashed ${faceImage ? "border-primary" : "border-border/60"} rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all`}
                    onClick={() => document.getElementById("face-upload")?.click()}
                  >
                    <input
                      id="face-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setFaceImage(e.target.files ? e.target.files[0] : null)}
                      accept="image/*"
                    />
                    <Upload className={`h-8 w-8 mx-auto ${faceImage ? "text-primary" : "text-primary/60"} mb-2`} />
                    <p className="text-sm text-muted-foreground font-medium">
                      {faceImage ? faceImage.name : "Click to upload face image"}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20"
                  onClick={handleAddStudent}
                  disabled={isAdding || classrooms.length === 0}
                >
                  {isAdding ? "Adding..." : "Save Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-9 bg-muted/50 border-border/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((student) => (
              <Card key={student.id} className="card-elevated hover:card-glow transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                      {student.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" disabled>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{student.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{student.roll_number}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
