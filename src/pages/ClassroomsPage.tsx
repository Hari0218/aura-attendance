import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, School, Users, Trash2, Upload, Camera, ImagePlus, ChevronRight } from "lucide-react";
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

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [addingClass, setAddingClass] = useState(false);

  // Add student form
  const [newStudent, setNewStudent] = useState({ name: "", rollNumber: "", email: "" });
  const [faceImages, setFaceImages] = useState<File[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    loadClassrooms();
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
      loadClassrooms();
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
      loadClassrooms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  const selectClassroom = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    try {
      const res = await studentApi.getAll();
      // Filter students by class_id
      const filtered = res.data.filter((s: Student) => s.class_id === classroom.id);
      setStudents(filtered);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.rollNumber) {
      toast.error("Name and Roll Number are required");
      return;
    }
    if (!selectedClassroom) return;

    setAddingStudent(true);
    try {
      // Create the student
      const res = await studentApi.create({
        name: newStudent.name,
        roll_number: newStudent.rollNumber,
        email: newStudent.email,
        class_id: selectedClassroom.id,
      });

      const studentId = res.data.id;

      // Upload face images (3-4 recommended)
      let uploadedCount = 0;
      for (const file of faceImages) {
        try {
          await studentApi.uploadFace(studentId, file);
          uploadedCount++;
        } catch (err) {
          console.error(`Failed to upload face image:`, err);
        }
      }

      if (faceImages.length > 0) {
        toast.success(`Student added with ${uploadedCount}/${faceImages.length} face photos uploaded`);
      } else {
        toast.success("Student added (no face photos yet — add them later for recognition)");
      }

      setNewStudent({ name: "", rollNumber: "", email: "" });
      setFaceImages([]);
      selectClassroom(selectedClassroom);
      loadClassrooms();
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
      if (selectedClassroom) selectClassroom(selectedClassroom);
      loadClassrooms();
    } catch (err: any) {
      toast.error("Failed to delete student");
    }
  };

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFaceImages((prev) => [...prev, ...newFiles].slice(0, 5)); // max 5 photos
    }
  };

  const removeFaceImage = (index: number) => {
    setFaceImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Classrooms</h1>
              <p className="text-sm text-muted-foreground">{classrooms.length} classrooms</p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Add Classroom
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>Create Classroom</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Classroom Name</Label>
                  <Input placeholder="e.g. AIDS-A" className="bg-muted/50" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input placeholder="e.g. AI & Data Science Section A" className="bg-muted/50" value={newClassDesc} onChange={(e) => setNewClassDesc(e.target.value)} />
                </div>
                <DialogClose asChild>
                  <Button className="w-full gradient-primary text-primary-foreground border-0 font-semibold" onClick={handleAddClassroom} disabled={addingClass}>
                    {addingClass ? "Creating..." : "Create Classroom"}
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classrooms List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-12"><div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : classrooms.length === 0 ? (
              <Card className="card-elevated"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <School className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No classrooms yet — create one above</p>
              </CardContent></Card>
            ) : (
              classrooms.map((c) => (
                <Card
                  key={c.id}
                  className={`card-elevated cursor-pointer transition-all duration-200 hover:card-glow ${selectedClassroom?.id === c.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => selectClassroom(c)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.student_count} students</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteClassroom(c.id, c.name); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Students in selected classroom */}
          <div className="lg:col-span-2">
            {selectedClassroom ? (
              <Card className="card-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">{selectedClassroom.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{students.length} students</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20">
                          <Plus className="h-4 w-4 mr-2" /> Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card max-w-lg">
                        <DialogHeader><DialogTitle>Add Student to {selectedClassroom.name}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Full Name *</Label>
                              <Input placeholder="Student name" className="bg-muted/50" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Roll / ID Number *</Label>
                              <Input placeholder="e.g. AIDS-A-001" className="bg-muted/50" value={newStudent.rollNumber} onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" placeholder="student@example.com" className="bg-muted/50" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
                          </div>

                          {/* Multi-photo upload */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Camera className="h-4 w-4" /> Face Photos (3-4 recommended for best accuracy)
                            </Label>
                            <div
                              className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
                              onClick={() => document.getElementById('multi-face-upload')?.click()}
                            >
                              <input id="multi-face-upload" type="file" className="hidden" onChange={handleFaceFileChange} accept="image/*" multiple />
                              <ImagePlus className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                              <p className="text-sm text-muted-foreground font-medium">Click to add photos (front, left, right angles)</p>
                              <p className="text-xs text-muted-foreground mt-1">Upload 3-4 different angle photos for best face recognition</p>
                            </div>

                            {faceImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {faceImages.map((file, i) => (
                                  <div key={i} className="relative group">
                                    <img src={URL.createObjectURL(file)} alt={`Face ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border-2 border-border" />
                                    <button
                                      className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeFaceImage(i)}
                                    >×</button>
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center rounded-b-lg">#{i + 1}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button className="w-full gradient-primary text-primary-foreground border-0 font-semibold" onClick={handleAddStudent} disabled={addingStudent}>
                            {addingStudent ? "Adding..." : `Add Student${faceImages.length > 0 ? ` with ${faceImages.length} photo${faceImages.length > 1 ? 's' : ''}` : ''}`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">No students in this classroom yet</p>
                      <p className="text-xs mt-1">Click "Add Student" to get started</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Roll Number</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => (
                          <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-semibold text-sm">{s.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="font-mono">{s.roll_number}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{s.email || "—"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteStudent(s.id, s.name)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="card-elevated">
                <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <School className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-semibold">Select a classroom</p>
                  <p className="text-sm mt-1">Choose a classroom from the left to view and manage students</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
