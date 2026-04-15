import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, School, Users, Trash2, Camera, ImagePlus, ChevronRight } from "lucide-react";
import { classroomApi, studentApi } from "@/lib/api";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  description: string;
  student_count: number;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  email: string;
  class_id: string;
}

const inputStyle: React.CSSProperties = {
  background: "#FDF6EE",
  borderColor: "#EDE0D4",
  color: "#2C1810",
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.2s ease",
};

const btnPrimary: React.CSSProperties = {
  background: "#C4622D",
  color: "#fff",
  borderRadius: "999px",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  border: "none",
  transition: "all 0.2s ease",
};

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [addingClass, setAddingClass] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", rollNumber: "", email: "" });
  const [faceImages, setFaceImages] = useState<File[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  useEffect(() => {
    void loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const res = await classroomApi.getAll();
      setClassrooms(res.data);
    } catch (err) {
      console.error("Failed to load classrooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClassroom = async () => {
    if (!newClassName.trim()) {
      toast.error("Please enter a classroom name");
      return;
    }

    setAddingClass(true);
    try {
      await classroomApi.create({ name: newClassName, description: newClassDesc });
      toast.success(`Classroom "${newClassName}" created`);
      setNewClassName("");
      setNewClassDesc("");
      setIsAddClassOpen(false);
      await loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create classroom");
    } finally {
      setAddingClass(false);
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!confirm(`Delete classroom "${name}"? Students won't be deleted but will be unassigned.`)) return;

    try {
      await classroomApi.delete(id);
      toast.success(`Classroom "${name}" deleted`);
      if (selectedClassroom?.id === id) {
        setSelectedClassroom(null);
        setStudents([]);
      }
      await loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  const selectClassroom = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    try {
      const res = await studentApi.getAll(classroom.id);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.rollNumber || !selectedClassroom) {
      toast.error("Name and roll number are required");
      return;
    }

    setAddingStudent(true);
    try {
      const res = await studentApi.create({
        name: newStudent.name,
        roll_number: newStudent.rollNumber,
        email: newStudent.email,
        class_id: selectedClassroom.id,
      });

      let uploadedCount = 0;
      for (const file of faceImages) {
        try {
          await studentApi.uploadFace(res.data.id, file);
          uploadedCount++;
        } catch (err: any) {
          console.error("Failed to upload face image:", err);
          toast.error(`Error with photo ${file.name}: ${err.response?.data?.detail || "Unknown error"}`);
        }
      }

      if (faceImages.length > 0) {
        toast.success(`Student added with ${uploadedCount}/${faceImages.length} face photos uploaded`);
      } else {
        toast.success("Student added without face photos. Add them later for recognition.");
      }

      setNewStudent({ name: "", rollNumber: "", email: "" });
      setFaceImages([]);
      setIsAddStudentOpen(false);
      await selectClassroom(selectedClassroom);
      await loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"?`)) return;

    try {
      await studentApi.delete(id);
      toast.success(`Student "${name}" deleted`);
      if (selectedClassroom) {
        await selectClassroom(selectedClassroom);
      }
      await loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete student");
    }
  };

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFaceImages((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFaceImage = (index: number) => {
    setFaceImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
          style={{ borderColor: "#EDE0D4" }}
        >
          <div className="flex flex-col">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
            >
              Classrooms
            </h1>
            <p className="mt-1" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
              Manage sections and enrolled students. Total: {classrooms.length}
            </p>
          </div>
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="font-semibold h-10 px-6 border-0" style={btnPrimary}>
                <Plus className="h-4 w-4 mr-2" /> Add Classroom
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
                  className="text-xl font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Create Classroom
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label
                    className="font-semibold"
                    style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Classroom Name
                  </Label>
                  <Input
                    placeholder="e.g. AIDS-A"
                    style={inputStyle}
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    className="font-semibold"
                    style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Description (optional)
                  </Label>
                  <Input
                    placeholder="e.g. AI & Data Science Section A"
                    style={inputStyle}
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full font-semibold border-0"
                  style={btnPrimary}
                  onClick={handleAddClassroom}
                  disabled={addingClass}
                >
                  {addingClass ? "Creating..." : "Create Classroom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classroom list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-12">
                <div
                  className="h-8 w-8 border-4 rounded-full animate-spin"
                  style={{ borderColor: "rgba(196,98,45,0.2)", borderTopColor: "#C4622D" }}
                />
              </div>
            ) : classrooms.length === 0 ? (
              <div className="card-elevated p-8 flex flex-col items-center justify-center text-center">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "#FDF6EE" }}
                >
                  <School className="h-8 w-8" style={{ color: "#7C5C4E" }} />
                </div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                >
                  No classrooms found
                </p>
              </div>
            ) : (
              classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="card-elevated cursor-pointer transition-all"
                  style={{
                    outline: selectedClassroom?.id === classroom.id ? "2px solid #C4622D" : "none",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => void selectClassroom(classroom)}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3
                        className="font-bold"
                        style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {classroom.name}
                      </h3>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {classroom.student_count} students
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        style={{ color: "#ef4444" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteClassroom(classroom.id, classroom.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight
                        className="h-5 w-5"
                        style={{
                          color: selectedClassroom?.id === classroom.id ? "#C4622D" : "#EDE0D4",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Student detail panel */}
          <div className="lg:col-span-2">
            {selectedClassroom ? (
              <div className="card-elevated overflow-hidden flex flex-col h-full bg-white">
                <div
                  className="p-6 border-b flex items-center justify-between"
                  style={{ borderColor: "#EDE0D4" }}
                >
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                    >
                      {selectedClassroom.name}
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {students.length} Total Students
                    </p>
                  </div>
                  <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="font-semibold px-4 h-9 border-0"
                        style={btnPrimary}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="max-w-lg"
                      style={{
                        background: "#fff",
                        border: "1px solid #EDE0D4",
                        borderRadius: "16px",
                        boxShadow: "0 2px 16px rgba(196,98,45,0.07)",
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle
                          className="text-xl font-bold"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                        >
                          Add Student to {selectedClassroom.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label
                              className="font-semibold"
                              style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Full Name *
                            </Label>
                            <Input
                              placeholder="Student name"
                              style={inputStyle}
                              value={newStudent.name}
                              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              className="font-semibold"
                              style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Roll / ID Number *
                            </Label>
                            <Input
                              placeholder="e.g. AIDS-A-001"
                              style={inputStyle}
                              value={newStudent.rollNumber}
                              onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            className="font-semibold"
                            style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Email (Optional)
                          </Label>
                          <Input
                            type="email"
                            placeholder="student@example.com"
                            style={inputStyle}
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            className="flex items-center gap-2 font-semibold"
                            style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <Camera className="h-4 w-4" /> Face Photos
                          </Label>
                          <div
                            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer"
                            style={{
                              borderColor: "#EDE0D4",
                              background: "#FDF6EE",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => document.getElementById("multi-face-upload")?.click()}
                          >
                            <input
                              id="multi-face-upload"
                              type="file"
                              className="hidden"
                              onChange={handleFaceFileChange}
                              accept="image/*"
                              multiple
                            />
                            <ImagePlus className="h-8 w-8 mx-auto mb-2" style={{ color: "#EDE0D4" }} />
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Click to add photos
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Upload 3–4 different angle photos for best accuracy
                            </p>
                          </div>

                          {faceImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {faceImages.map((file, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Face ${index + 1}`}
                                    className="h-16 w-16 rounded-lg object-cover border"
                                    style={{ borderColor: "#EDE0D4" }}
                                  />
                                  <button
                                    type="button"
                                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-sm hover:scale-110 transition-transform"
                                    onClick={() => removeFaceImage(index)}
                                  >
                                    x
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full font-semibold mt-2 border-0"
                          style={btnPrimary}
                          onClick={handleAddStudent}
                          disabled={addingStudent}
                        >
                          {addingStudent
                            ? "Adding..."
                            : `Add Student${faceImages.length > 0 ? ` with ${faceImages.length} photo${faceImages.length > 1 ? "s" : ""}` : ""}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="p-0">
                  {students.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-24"
                      style={{ color: "#7C5C4E" }}
                    >
                      <div
                        className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                        style={{ background: "#FDF6EE" }}
                      >
                        <Users className="h-8 w-8" style={{ color: "#7C5C4E" }} />
                      </div>
                      <p
                        className="font-medium"
                        style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        No students registered
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Add students to see them here
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader style={{ background: "#FDF6EE" }}>
                        <TableRow className="hover:bg-transparent">
                          <TableHead
                            className="font-semibold"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Name
                          </TableHead>
                          <TableHead
                            className="font-semibold"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            ID Number
                          </TableHead>
                          <TableHead
                            className="font-semibold"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Email
                          </TableHead>
                          <TableHead
                            className="text-right font-semibold"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow
                            key={student.id}
                            className="transition-colors"
                            style={{ borderColor: "#EDE0D4" }}
                          >
                            <TableCell
                              className="font-bold text-sm"
                              style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {student.name}
                            </TableCell>
                            <TableCell>
                              <span
                                className="px-2.5 py-1 rounded-md text-xs font-semibold"
                                style={{
                                  background: "rgba(196,98,45,0.08)",
                                  color: "#7C5C4E",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                {student.roll_number}
                              </span>
                            </TableCell>
                            <TableCell
                              className="text-sm"
                              style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {student.email || "–"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                style={{ color: "#ef4444" }}
                                onClick={() => void handleDeleteStudent(student.id, student.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl"
                style={{ background: "#FDF6EE", borderColor: "#EDE0D4" }}
              >
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-6 border"
                  style={{ background: "#fff", borderColor: "#EDE0D4" }}
                >
                  <School className="h-10 w-10" style={{ color: "#EDE0D4" }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Select a Classroom
                </h3>
                <p
                  className="text-sm text-center max-w-sm"
                  style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Click on a classroom from the left panel to view and manage its students.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
