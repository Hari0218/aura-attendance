import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, RefreshCw, Download, Scan, UserCheck, UserX, Clock, X, Sparkles, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceApi, classroomApi } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Phase = "upload" | "processing" | "results";

interface Classroom {
  id: string;
  name: string;
}

interface AttendancePerson {
  id: string;
  name: string;
  confidence?: number;
}

interface AttendanceResults {
  recognized: AttendancePerson[];
  absent: AttendancePerson[];
  unknown_faces_count: number;
}

const processingSteps = [
  { label: "Detecting Faces", icon: Scan },
  { label: "Matching Faces", icon: UserCheck },
  { label: "Verifying Identity", icon: Check },
  { label: "Generating Attendance", icon: Clock },
];

export default function MarkAttendancePage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [results, setResults] = useState<AttendanceResults | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const response = await classroomApi.getAll();
      setClassrooms(response.data);
      if (response.data.length > 0) {
        setSelectedClassId(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
      toast.error("Failed to load classrooms");
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetFlow = () => {
    setPhase("upload");
    setPreview(null);
    setSelectedFile(null);
    setResults(null);
    setCurrentStep(0);
    setStepProgress(0);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  }, []);

  const startRecognition = async () => {
    if (!selectedFile || !selectedClassId) return;

    setPhase("processing");
    setCurrentStep(0);
    setStepProgress(25);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentStep(1);
      setStepProgress(50);

      const response = await attendanceApi.uploadPhoto(selectedFile, selectedClassId);

      setCurrentStep(2);
      setStepProgress(75);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const data = response.data;
      setResults({
        recognized: (data.recognized_student_ids || []).map((id: string, index: number) => ({
          id,
          name: data.recognized_students[index],
          confidence: data.confidence_scores[index],
        })),
        absent: (data.absent_student_ids || []).map((id: string, index: number) => ({
          id,
          name: data.absent_students[index],
        })),
        unknown_faces_count: data.unknown_faces_count || 0,
      });

      setCurrentStep(3);
      setStepProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPhase("results");
      toast.success("Attendance processed successfully");
    } catch (error: any) {
      console.error("Recognition failed:", error);
      toast.error(error.response?.data?.detail || "Recognition failed");
      setPhase("upload");
    }
  };

  const moveToAbsent = (student: AttendancePerson) => {
    if (!results) return;
    setResults({
      ...results,
      recognized: results.recognized.filter((person) => person.id !== student.id),
      absent: [...results.absent, { id: student.id, name: student.name }],
    });
    toast.info(`${student.name} marked as absent`);
  };

  const moveToPresent = (student: AttendancePerson) => {
    if (!results) return;
    setResults({
      ...results,
      absent: results.absent.filter((person) => person.id !== student.id),
      recognized: [...results.recognized, { id: student.id, name: student.name, confidence: 1 }],
    });
    toast.success(`${student.name} marked as present`);
  };

  const confirmAttendance = async () => {
    if (!results || !selectedClassId) return;

    setSaving(true);
    try {
      await attendanceApi.finalize({
        class_id: selectedClassId,
        present_student_ids: results.recognized.map((student) => student.id),
        absent_student_ids: results.absent.map((student) => student.id),
      });
      toast.success("Attendance confirmed and saved");
    } catch (error: any) {
      console.error("Failed to finalize attendance:", error);
      toast.error(error.response?.data?.detail || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const downloadSummary = () => {
    if (!results) return;
    const lines = [
      ["Status", "Name", "Confidence"],
      ...results.recognized.map((student) => ["Present", student.name, student.confidence ? `${(student.confidence * 100).toFixed(1)}%` : "Manual"]),
      ...results.absent.map((student) => ["Absent", student.name, "-"]),
    ];
    const csv = lines.map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-summary.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance summary downloaded");
  };

  const recognizedCount = results?.recognized.length || 0;
  const absentCount = results?.absent.length || 0;
  const avgConfidence = useMemo(() => {
    if (!results || results.recognized.length === 0) return "0";
    const scored = results.recognized.filter((student) => typeof student.confidence === "number");
    if (scored.length === 0) return "0";
    return ((scored.reduce((total, student) => total + (student.confidence || 0), 0) / scored.length) * 100).toFixed(1);
  }, [results]);

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mark Attendance</h1>
            <p className="text-gray-500 mt-1">Upload a classroom photo to auto-detect attendance</p>
          </div>
          <div className="w-full md:w-72">
            <p className="text-sm font-semibold text-gray-700 mb-2">Classroom</p>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="bg-white border-gray-200 shadow-sm">
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
        </div>

        {phase === "upload" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated bg-white">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Upload Classroom Photo</h2>
              </div>
              <div className="p-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer relative overflow-hidden ${dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedFile ? selectedFile.name : "Drag and drop or click to upload"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">PNG or JPG up to 10MB</p>
                </div>
                {preview && (
                  <div className="mt-4 relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-md"
                  disabled={!preview || !selectedClassId}
                  onClick={startRecognition}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start AI Recognition
                </Button>
              </div>
            </div>

            <div className="card-elevated bg-white flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" /> 
                <h2 className="text-lg font-bold text-gray-900">How It Works</h2>
              </div>
              <div className="p-6 space-y-6 flex-1">
                {processingSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Step {index + 1}: {step.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Automated deep learning process</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="card-elevated max-w-lg mx-auto overflow-hidden bg-white">
            <div className="p-10 space-y-8">
              <div className="text-center">
                <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Scan className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Processing Image...</h2>
                <p className="text-gray-500 mt-2">Analyzing faces and matching records</p>
              </div>
              <div className="space-y-5">
                {processingSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${index < currentStep ? "bg-green-100 text-green-600" : index === currentStep ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                      {index < currentStep ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold transition-colors ${index <= currentStep ? "text-gray-900" : "text-gray-400"}`}>
                        {step.label}
                      </p>
                      {index === currentStep && <Progress value={stepProgress} className="h-2 mt-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "results" && results && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: "Recognized", value: recognizedCount, icon: UserCheck, color: "text-primary", bg: "bg-primary/10" },
                { label: "Unknown", value: results.unknown_faces_count, icon: Scan, color: "text-gray-500", bg: "bg-gray-100" },
                { label: "Absent", value: absentCount, icon: UserX, color: "text-red-500", bg: "bg-red-50" },
                { label: "Avg Confidence", value: `${avgConfidence}%`, icon: Check, color: "text-green-500", bg: "bg-green-50" },
                { label: "Date", value: "Today", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
              ].map((item) => (
                <div key={item.label} className="card-elevated p-5 flex flex-col items-center justify-center text-center bg-white">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${item.bg} ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="card-elevated bg-white">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">Attendance Results</h2>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-bold">{recognizedCount} Present</span>
                  {results.unknown_faces_count > 0 && (
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">{results.unknown_faces_count} Unknown Detected</span>
                  )}
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold">{absentCount} Absent</span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.recognized.map((student) => (
                    <div
                      key={`present-${student.id}`}
                      className="rounded-xl border p-4 flex items-center gap-3 transition-all cursor-pointer border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      onClick={() => moveToAbsent(student)}
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-green-100 text-green-700">
                        {student.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">Present</span>
                          <span className="text-xs text-gray-500 font-medium">
                            {typeof student.confidence === "number" ? `${(student.confidence * 100).toFixed(1)}%` : "Manual"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.absent.map((student) => (
                    <div
                      key={`absent-${student.id}`}
                      className="rounded-xl border p-4 flex items-center gap-3 transition-all cursor-pointer border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      onClick={() => moveToPresent(student)}
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold bg-red-100 text-red-700">
                        {student.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase">Absent</span>
                          <span className="text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-600 transition-colors">Click to mark present</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-md" onClick={confirmAttendance} disabled={saving}>
                <Check className="h-5 w-5 mr-2" /> {saving ? "Saving..." : "Confirm Attendance"}
              </Button>
              <Button variant="outline" className="h-12 px-6 font-semibold rounded-xl text-gray-700 bg-white" onClick={resetFlow}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-scan
              </Button>
              <Button variant="outline" className="h-12 px-6 font-semibold rounded-xl text-gray-700 bg-white" onClick={downloadSummary}>
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
