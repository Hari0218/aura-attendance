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
import { motion } from "framer-motion";

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
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Classrooms</h1>
            <p className="text-gray-500 mt-1">Manage sections and enrolled students. Total: {classrooms.length}</p>
          </div>
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 px-6 rounded-full shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> Add Classroom
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">Create Classroom</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Classroom Name</Label>
                  <Input placeholder="e.g. AIDS-A" className="bg-gray-50 border-gray-200" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Description (optional)</Label>
                  <Input placeholder="e.g. AI & Data Science Section A" className="bg-gray-50 border-gray-200" value={newClassDesc} onChange={(e) => setNewClassDesc(e.target.value)} />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl" onClick={handleAddClassroom} disabled={addingClass}>
                  {addingClass ? "Creating..." : "Create Classroom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : classrooms.length === 0 ? (
              <div className="card-elevated p-8 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <School className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No classrooms found</p>
              </div>
            ) : (
              classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className={`group card-elevated cursor-pointer transition-all ${selectedClassroom?.id === classroom.id ? "ring-2 ring-primary border-transparent" : ""}`}
                  onClick={() => void selectClassroom(classroom)}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{classroom.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{classroom.student_count} students</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteClassroom(classroom.id, classroom.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className={`h-5 w-5 ${selectedClassroom?.id === classroom.id ? "text-primary" : "text-gray-300 group-hover:text-gray-400"}`} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedClassroom ? (
              <div className="card-elevated overflow-hidden flex flex-col h-full bg-white">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClassroom.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{students.length} Total Students</p>
                  </div>
                  <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 rounded-full font-semibold px-4 h-9">
                        <Plus className="h-4 w-4 mr-2" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Add Student to {selectedClassroom.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="font-semibold text-gray-700">Full Name *</Label>
                            <Input placeholder="Student name" className="bg-gray-50 border-gray-200" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-semibold text-gray-700">Roll / ID Number *</Label>
                            <Input placeholder="e.g. AIDS-A-001" className="bg-gray-50 border-gray-200" value={newStudent.rollNumber} onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold text-gray-700">Email (Optional)</Label>
                          <Input type="email" placeholder="student@example.com" className="bg-gray-50 border-gray-200" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 font-semibold text-gray-700">
                            <Camera className="h-4 w-4" /> Face Photos
                          </Label>
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-colors"
                            onClick={() => document.getElementById("multi-face-upload")?.click()}
                          >
                            <input id="multi-face-upload" type="file" className="hidden" onChange={handleFaceFileChange} accept="image/*" multiple />
                            <ImagePlus className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Click to add photos</p>
                            <p className="text-xs text-gray-400 mt-1">Upload 3-4 different angle photos for best accuracy</p>
                          </div>

                          {faceImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {faceImages.map((file, index) => (
                                <div key={index} className="relative group">
                                  <img src={URL.createObjectURL(file)} alt={`Face ${index + 1}`} className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
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

                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl mt-2" onClick={handleAddStudent} disabled={addingStudent}>
                          {addingStudent ? "Adding..." : `Add Student${faceImages.length > 0 ? ` with ${faceImages.length} photo${faceImages.length > 1 ? "s" : ""}` : ""}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="p-0">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                      <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium">No students registered</p>
                      <p className="text-sm mt-1">Add students to see them here</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold text-gray-500">Name</TableHead>
                          <TableHead className="font-semibold text-gray-500">ID Number</TableHead>
                          <TableHead className="font-semibold text-gray-500">Email</TableHead>
                          <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-bold text-gray-900">{student.name}</TableCell>
                            <TableCell>
                              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                                {student.roll_number}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">{student.email || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => void handleDeleteStudent(student.id, student.name)}>
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
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                  <School className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Classroom</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                  Click on a classroom from the left panel to view and manage its students.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
