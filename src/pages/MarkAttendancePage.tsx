import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, RefreshCw, Download, Scan, UserCheck, UserX, Clock, X, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceApi, classroomApi } from "@/lib/api";
import { toast } from "sonner";

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

const PERIODS = [
  { value: "P1", label: "Period 1", time: "8:30 – 9:25" },
  { value: "P2", label: "Period 2", time: "9:25 – 10:20" },
  { value: "P3", label: "Period 3", time: "10:45 – 11:30" },
  { value: "P4", label: "Period 4", time: "11:40 – 12:35" },
  { value: "P5", label: "Period 5", time: "1:30 – 2:30" },
  { value: "P6", label: "Period 6", time: "2:30 – 3:30" },
  { value: "P7", label: "Period 7", time: "3:30 – 4:30" },
];

const processingSteps = [
  { label: "Detecting Faces", icon: Scan },
  { label: "Matching Faces", icon: UserCheck },
  { label: "Verifying Identity", icon: Check },
  { label: "Generating Attendance", icon: Clock },
];

const btnPrimary: React.CSSProperties = {
  background: "#C4622D",
  color: "#fff",
  borderRadius: "999px",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  border: "none",
  transition: "all 0.2s ease",
};

const btnOutline: React.CSSProperties = {
  background: "#fff",
  color: "#2C1810",
  borderRadius: "999px",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  borderColor: "#EDE0D4",
  transition: "all 0.2s ease",
};

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
  const [selectedPeriod, setSelectedPeriod] = useState("P1");
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

      const response = await attendanceApi.uploadPhoto(selectedFile, selectedClassId, selectedPeriod);

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
        period: selectedPeriod,
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
      <div className="space-y-8 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex flex-col">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
            >
              Mark Attendance
            </h1>
            <p className="mt-1" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
              Upload a classroom photo to auto-detect attendance
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Classroom selector */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>CLASSROOM</p>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger
                  className="w-full sm:w-48"
                  style={{
                    background: "#fff",
                    borderColor: "#EDE0D4",
                    color: "#2C1810",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
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
            {/* Period selector */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>PERIOD</p>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger
                  className="w-full sm:w-56"
                  style={{
                    background: "#fff",
                    borderColor: "#EDE0D4",
                    color: "#2C1810",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="font-semibold">{p.label}</span>
                      <span className="ml-2 text-xs opacity-60">{p.time}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Upload phase */}
        {phase === "upload" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated bg-white">
              <div
                className="p-6 border-b"
                style={{ borderColor: "#EDE0D4" }}
              >
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Upload Classroom Photo
                </h2>
              </div>
              <div className="p-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer relative overflow-hidden"
                  style={{
                    borderColor: dragOver ? "#C4622D" : "#EDE0D4",
                    background: dragOver ? "rgba(196,98,45,0.04)" : "#FDF6EE",
                    transition: "all 0.2s ease",
                  }}
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
                  <div
                    className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ background: "#EDE0D4" }}
                  >
                    <Upload className="h-8 w-8" style={{ color: "#7C5C4E" }} />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {selectedFile ? selectedFile.name : "Drag and drop or click to upload"}
                  </p>
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    PNG or JPG up to 10MB
                  </p>
                </div>
                {preview && (
                  <div
                    className="mt-4 relative rounded-xl overflow-hidden border"
                    style={{ borderColor: "#EDE0D4" }}
                  >
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.9)", color: "#2C1810" }}
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
                  className="w-full mt-6 h-12 font-semibold border-0"
                  style={{ ...btnPrimary, opacity: (!preview || !selectedClassId) ? 0.5 : 1 }}
                  disabled={!preview || !selectedClassId}
                  onClick={startRecognition}
                >
                  <Scan className="h-5 w-5 mr-2" />
                  Start AI Recognition
                </Button>
              </div>
            </div>

            <div className="card-elevated bg-white flex flex-col">
              <div className="p-6 border-b flex items-center gap-2" style={{ borderColor: "#EDE0D4" }}>
                <Zap className="h-5 w-5" style={{ color: "#C4622D" }} />
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  How It Works
                </h2>
              </div>
              <div className="p-6 space-y-6 flex-1">
                {processingSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{ background: "#FDF6EE", borderColor: "#EDE0D4" }}
                    >
                      <step.icon className="h-6 w-6" style={{ color: "#C4622D" }} />
                    </div>
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Step {index + 1}: {step.label}
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Automated deep learning process
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing phase */}
        {phase === "processing" && (
          <div className="card-elevated max-w-lg mx-auto overflow-hidden bg-white">
            <div className="p-10 space-y-8">
              <div className="text-center">
                <div
                  className="h-24 w-24 mx-auto rounded-full flex items-center justify-center mb-6"
                  style={{ background: "rgba(196,98,45,0.1)" }}
                >
                  <Scan className="h-12 w-12 animate-pulse" style={{ color: "#C4622D" }} />
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Processing Image...
                </h2>
                <p className="mt-2" style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}>
                  Analyzing faces and matching records
                </p>
              </div>
              <div className="space-y-5">
                {processingSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        background:
                          index < currentStep
                            ? "#D1FAE5"
                            : index === currentStep
                            ? "#C4622D"
                            : "#F5F5F5",
                        color:
                          index < currentStep
                            ? "#065F46"
                            : index === currentStep
                            ? "#fff"
                            : "#9CA3AF",
                      }}
                    >
                      {index < currentStep ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-semibold transition-colors"
                        style={{
                          color: index <= currentStep ? "#2C1810" : "#9CA3AF",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
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

        {/* Results phase */}
        {phase === "results" && results && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: "Recognized", value: recognizedCount, icon: UserCheck, color: "#C4622D", bg: "rgba(196,98,45,0.1)" },
                { label: "Unknown", value: results.unknown_faces_count, icon: Scan, color: "#7C5C4E", bg: "#F5F5F5" },
                { label: "Absent", value: absentCount, icon: UserX, color: "#ef4444", bg: "#FEE2E2" },
                { label: "Avg Confidence", value: `${avgConfidence}%`, icon: Check, color: "#059669", bg: "#D1FAE5" },
                { label: "Date", value: "Today", icon: Clock, color: "#d97706", bg: "#FEF3C7" },
              ].map((item) => (
                <div key={item.label} className="card-elevated p-5 flex flex-col items-center justify-center text-center bg-white">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
                    style={{ background: item.bg, color: item.color }}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                  >
                    {item.value}
                  </p>
                  <p
                    className="section-label mt-1"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="card-elevated bg-white">
              <div
                className="p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ borderColor: "#EDE0D4" }}
              >
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#2C1810" }}
                >
                  Attendance Results
                </h2>
                <div className="flex gap-2">
                  <span className="badge-present">{recognizedCount} Present</span>
                  {results.unknown_faces_count > 0 && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "#F5F5F5", color: "#7C5C4E" }}
                    >
                      {results.unknown_faces_count} Unknown
                    </span>
                  )}
                  <span className="badge-absent">{absentCount} Absent</span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.recognized.map((student) => (
                    <div
                      key={`present-${student.id}`}
                      className="rounded-xl border p-4 flex items-center gap-3 cursor-pointer"
                      style={{
                        borderColor: "#EDE0D4",
                        background: "#fff",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => moveToAbsent(student)}
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: "#D1FAE5", color: "#065F46" }}
                      >
                        {student.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-present">Present</span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {typeof student.confidence === "number" ? `${(student.confidence * 100).toFixed(1)}%` : "Manual"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.absent.map((student) => (
                    <div
                      key={`absent-${student.id}`}
                      className="rounded-xl border p-4 flex items-center gap-3 cursor-pointer"
                      style={{
                        borderColor: "#EDE0D4",
                        background: "#fff",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => moveToPresent(student)}
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: "#FEE2E2", color: "#991B1B" }}
                      >
                        {student.name.split(" ").map((part) => part[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: "#2C1810", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {student.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-absent">Absent</span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#7C5C4E", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Click to mark present
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="h-12 px-8 font-bold border-0"
                style={btnPrimary}
                onClick={confirmAttendance}
                disabled={saving}
              >
                <Check className="h-5 w-5 mr-2" /> {saving ? "Saving..." : "Confirm Attendance"}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 font-semibold"
                style={btnOutline}
                onClick={resetFlow}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Re-scan
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 font-semibold"
                style={btnOutline}
                onClick={downloadSummary}
              >
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
