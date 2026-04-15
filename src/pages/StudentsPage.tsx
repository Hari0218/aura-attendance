import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Upload, Users, RotateCcw } from "lucide-react";
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
  const [clearingFaces, setClearingFaces] = useState<string | null>(null);

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

  const handleClearFaces = async (studentId: string, studentName: string) => {
    if (!confirm(`Delete ALL face data for ${studentName}? They will need to be re-registered.`)) return;
    setClearingFaces(studentId);
    try {
      const res = await studentApi.clearFaces(studentId);
      toast.success(res.data.message || "Face data cleared");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to clear face data");
    } finally {
      setClearingFaces(null);
    }
  };

  const filtered = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(196,98,45,0.12)" }}
            >
              <Users className="h-5 w-5" style={{ color: "#C4622D" }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
              >
                Students
              </h1>
              <p className="text-sm" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                {students.length} students enrolled
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="font-semibold border-0"
                style={{
                  background: "#C4622D",
                  color: "#fff",
                  borderRadius: "999px",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent
              style={{
                background: "#fff",
                border: "1px solid #EDE0D4",
                borderRadius: "16px",
                boxShadow: "0 2px 16px rgba(196,98,45,0.07)",
              }}
            >
              <DialogHeader>
                <DialogTitle
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Add New Student
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>Full Name</Label>
                  <Input
                    placeholder="Student name"
                    style={inputStyle}
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>Roll Number</Label>
                  <Input
                    placeholder="e.g. AIDS-A-013"
                    style={inputStyle}
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>Classroom</Label>
                  <Select
                    value={newStudent.classId}
                    onValueChange={(value) => setNewStudent({ ...newStudent, classId: value })}
                  >
                    <SelectTrigger style={{ ...inputStyle }}>
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
                  <Label style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}>Face Image</Label>
                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: faceImage ? "#C4622D" : "#EDE0D4",
                      background: faceImage ? "rgba(196,98,45,0.04)" : "#FDF6EE",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => document.getElementById("face-upload")?.click()}
                  >
                    <input
                      id="face-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setFaceImage(e.target.files ? e.target.files[0] : null)}
                      accept="image/*"
                    />
                    <Upload
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: faceImage ? "#C4622D" : "#7C5C4E" }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {faceImage ? faceImage.name : "Click to upload face image"}
                    </p>
                  </div>
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
                  onClick={handleAddStudent}
                  disabled={isAdding || classrooms.length === 0}
                >
                  {isAdding ? "Adding..." : "Save Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "#7C5C4E" }}
          />
          <Input
            placeholder="Search students..."
            style={{ ...inputStyle, paddingLeft: "36px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Student cards */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div
              className="h-8 w-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "rgba(196,98,45,0.2)", borderTopColor: "#C4622D" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((student) => (
              <Card
                key={student.id}
                className="card-elevated overflow-hidden group"
                style={{ transition: "all 0.2s ease" }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-base text-white"
                      style={{
                        background: "linear-gradient(135deg, #C4622D 0%, #D4784A 100%)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      {student.name.split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        title="Reset face data"
                        style={{ color: "#d97706" }}
                        onClick={() => handleClearFaces(student.id, student.name)}
                        disabled={clearingFaces === student.id}
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${clearingFaces === student.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        style={{ color: "#7C5C4E" }}
                        disabled
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        style={{ color: "#ef4444" }}
                        disabled
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3
                    className="font-bold text-sm"
                    style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {student.name}
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {student.roll_number}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* ---- Danger Zone ---- */}
        <div
          className="rounded-2xl border-2 p-5"
          style={{ borderColor: "#FCA5A5", background: "#FFF5F5" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm" style={{ color: "#991B1B", fontFamily: "'DM Sans', sans-serif" }}>
                ⚠️ Purge All Face Data
              </p>
              <p className="text-xs mt-1" style={{ color: "#7f1d1d", fontFamily: "'DM Sans', sans-serif" }}>
                Deletes every stored face embedding. Use this if recognition is producing wrong results due to bad registration photos.
                After purging, re-register each student with a clear frontal photo.
              </p>
            </div>
            <button
              onClick={async () => {
                if (!confirm("⚠️ This will delete ALL face data for ALL students. They'll need to be re-registered. Are you sure?")) return;
                try {
                  const res = await studentApi.purgeAllFaces();
                  toast.success(res.data.message);
                } catch (err: any) {
                  toast.error(err.response?.data?.detail || "Purge failed");
                }
              }}
              className="shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all duration-150"
              style={{
                background: "#ef4444",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                border: "none",
                cursor: "pointer",
              }}
            >
              Purge All Face Data
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
