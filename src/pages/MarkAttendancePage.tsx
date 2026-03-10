import { useState, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, RefreshCw, Download, Scan, UserCheck, UserX, Clock, X, Sparkles, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { attendanceApi, studentApi } from "@/lib/api";
import { toast } from "sonner";

type Phase = "upload" | "processing" | "results";

const processingSteps = [
  { label: "Detecting Faces", icon: Scan, color: "from-primary to-purple-500" },
  { label: "Matching Faces", icon: UserCheck, color: "from-purple-500 to-pink-500" },
  { label: "Verifying Identity", icon: Check, color: "from-pink-500 to-orange-500" },
  { label: "Generating Attendance", icon: Clock, color: "from-orange-500 to-yellow-500" },
];

export default function MarkAttendancePage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentApi.getAll();
      setAllStudents(response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, []);

  const startRecognition = async () => {
    if (!selectedFile) return;

    setPhase("processing");
    setCurrentStep(0);
    setStepProgress(25);

    try {
      // Step 0: Already in progress (Detecting)
      await new Promise(r => setTimeout(r, 500));

      // Step 1: Matching
      setCurrentStep(1);
      setStepProgress(50);

      const response = await attendanceApi.uploadPhoto(selectedFile);

      // Step 2: Verifying
      setCurrentStep(2);
      setStepProgress(75);
      await new Promise(r => setTimeout(r, 500));

      setResults(response.data);

      // Step 3: Generating
      setCurrentStep(3);
      setStepProgress(100);
      await new Promise(r => setTimeout(r, 500));

      setPhase("results");
      toast.success("Attendance marked successfully!");

    } catch (error: any) {
      console.error("Recognition failed:", error);
      toast.error(error.response?.data?.detail || "Recognition failed");
      setPhase("upload");
    }
  };

  const getStudentName = (id: string) => {
    const student = allStudents.find(s => s.id === id);
    return student ? student.name : `Student ${id.substring(0, 4)}`;
  };

  const recognizedCount = results?.recognized_students?.length || 0;
  const absentCount = results?.absent_students?.length || 0;
  const avgConfidence = results?.confidence_scores?.length
    ? (results.confidence_scores.reduce((a: number, b: number) => a + b, 0) / results.confidence_scores.length * 100).toFixed(1)
    : "0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Scan className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
            <p className="text-muted-foreground text-sm">Upload a classroom photo to auto-detect attendance</p>
          </div>
        </div>

        {phase === "upload" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader><CardTitle className="text-base font-semibold">Upload Classroom Photo</CardTitle></CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer relative overflow-hidden ${dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                    }`}
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
                  <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedFile ? selectedFile.name : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG up to 10MB</p>
                </div>
                {preview && (
                  <div className="mt-4 relative rounded-xl overflow-hidden shadow-lg">
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-lg backdrop-blur-sm"
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  className="w-full mt-4 h-11 gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20"
                  disabled={!preview}
                  onClick={startRecognition}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Recognition
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {processingSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-4 group">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-primary-foreground shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Step {i + 1}: {step.label}</p>
                      <p className="text-xs text-muted-foreground">AI-powered automated process</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {phase === "processing" && (
          <Card className="card-glow max-w-lg mx-auto overflow-hidden">
            <CardContent className="p-8 space-y-6 relative">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-5 shadow-xl shadow-primary/30 glow-primary">
                  <Scan className="h-10 w-10 text-primary-foreground animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Processing Image...</h2>
                <p className="text-sm text-muted-foreground mt-1">Analyzing faces in the classroom photo</p>
              </div>
              <div className="space-y-4">
                {processingSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${i < currentStep ? "bg-green-500 text-white" :
                        i === currentStep ? "gradient-primary text-white" :
                          "bg-muted text-muted-foreground"
                      }`}>
                      {i < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm transition-all ${i <= currentStep ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      {i === currentStep && <Progress value={stepProgress} className="h-1.5 mt-1.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {phase === "results" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Recognized", value: recognizedCount, color: "from-primary/15 to-purple-500/10", icon: UserCheck, iconColor: "text-primary" },
                { label: "Unknown Faces", value: results?.unknown_faces_count || 0, color: "from-gray-500/15 to-slate-400/10", icon: Scan, iconColor: "text-muted-foreground" },
                { label: "Absent", value: absentCount, color: "from-red-500/15 to-orange-400/10", icon: UserX, iconColor: "text-destructive" },
                { label: "Avg. Confidence", value: `${avgConfidence}%`, color: "from-emerald-500/15 to-green-400/10", icon: Check, iconColor: "text-success" },
                { label: "Timestamp", value: "Now", color: "from-amber-500/15 to-yellow-400/10", icon: Clock, iconColor: "text-warning" },
              ].map((item) => (
                <Card key={item.label} className="card-elevated overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
                  <CardContent className="p-4 text-center relative">
                    <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.iconColor}`} />
                    <p className="text-xl font-extrabold text-foreground">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold">Attendance Results</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-green-500/10 text-green-600 border-0 font-semibold">{recognizedCount} Present</Badge>
                  {results?.unknown_faces_count > 0 && (
                    <Badge className="bg-gray-500/10 text-gray-600 border-0 font-semibold">{results.unknown_faces_count} Unknown Detected</Badge>
                  )}
                  <Badge className="bg-red-500/10 text-red-600 border-0 font-semibold">{absentCount} Absent</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {results?.recognized_students?.map((name: string, index: number) => (
                    <div 
                      key={`present-${index}`} 
                      className="rounded-xl border p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-md cursor-pointer border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                      onClick={() => {
                        const newRecognized = results.recognized_students.filter((n: string) => n !== name);
                        const newAbsent = [...results.absent_students, name];
                        setResults({...results, recognized_students: newRecognized, absent_students: newAbsent});
                        toast.info(`${name} marked as Absent`);
                      }}
                    >
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm bg-green-500/20 text-green-600">
                        {name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600">Present</Badge>
                          <span className="text-[10px] text-muted-foreground font-medium">{results.confidence_scores[index] ? (results.confidence_scores[index] * 100).toFixed(1) : "Manually"}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {results?.absent_students?.map((name: string, index: number) => (
                    <div 
                      key={`absent-${index}`} 
                      className="rounded-xl border p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-md cursor-pointer border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                      onClick={() => {
                        const newAbsent = results.absent_students.filter((n: string) => n !== name);
                        const newRecognized = [...results.recognized_students, name];
                        setResults({...results, recognized_students: newRecognized, absent_students: newAbsent});
                        toast.success(`${name} manually marked as Present`);
                      }}
                    >
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm bg-red-500/20 text-red-600">
                        {name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600">Absent</Badge>
                          <p className="text-[10px] text-muted-foreground">Click to mark Present</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button className="gradient-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold" onClick={() => toast.success("Attendance confirmed!")}>
                <Check className="h-4 w-4 mr-2" /> Confirm Attendance
              </Button>
              <Button variant="outline" className="font-medium" onClick={() => { setPhase("upload"); setPreview(null); setSelectedFile(null); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-scan
              </Button>
              <Button variant="outline" className="font-medium" onClick={() => toast.success("Report downloaded!")}>
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
