import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, RefreshCw, Download, Scan, UserCheck, UserX, Clock, X } from "lucide-react";
import { mockStudents } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type Phase = "upload" | "processing" | "results";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const { toast } = useToast();

  const simulateProcessing = useCallback(() => {
    setPhase("processing");
    setCurrentStep(0);
    setStepProgress(0);
    let step = 0;
    const interval = setInterval(() => {
      setStepProgress((p) => {
        if (p >= 100) {
          step++;
          if (step >= 4) {
            clearInterval(interval);
            setPhase("results");
            return 100;
          }
          setCurrentStep(step);
          return 0;
        }
        return p + 5;
      });
    }, 80);
  }, []);

  const handleFile = (file: File) => {
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

  const presentStudents = mockStudents.filter((s) => s.status === "present");
  const absentStudents = mockStudents.filter((s) => s.status === "absent");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
          <p className="text-muted-foreground text-sm">Upload a classroom photo to auto-detect attendance</p>
        </div>

        {phase === "upload" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Upload Classroom Photo</CardTitle></CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </div>
                {preview && (
                  <div className="mt-4 relative">
                    <img src={preview} alt="Preview" className="rounded-lg w-full max-h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={() => setPreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  className="w-full mt-4 gradient-primary text-primary-foreground border-0"
                  disabled={!preview}
                  onClick={simulateProcessing}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Start Recognition
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">How It Works</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {processingSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Step {i + 1}: {step.label}</p>
                      <p className="text-xs text-muted-foreground">AI-powered automated process</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {phase === "processing" && (
          <Card className="border-border/50 max-w-lg mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4">
                  <Scan className="h-8 w-8 text-primary-foreground animate-pulse" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Processing Image...</h2>
                <p className="text-sm text-muted-foreground">Analyzing faces in the classroom photo</p>
              </div>
              <div className="space-y-4">
                {processingSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      i < currentStep ? "bg-success text-success-foreground" :
                      i === currentStep ? "gradient-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      {i === currentStep && <Progress value={stepProgress} className="h-1 mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {phase === "results" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-border/50"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{presentStudents.length}</p>
                <p className="text-xs text-muted-foreground">Recognized</p>
              </CardContent></Card>
              <Card className="border-border/50"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{absentStudents.length}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent></Card>
              <Card className="border-border/50"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">96.2%</p>
                <p className="text-xs text-muted-foreground">Avg. Confidence</p>
              </CardContent></Card>
              <Card className="border-border/50"><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">Now</p>
                <p className="text-xs text-muted-foreground">Timestamp</p>
              </CardContent></Card>
            </div>

            {/* Student cards */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Attendance Results</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-success/10 text-success border-0">{presentStudents.length} Present</Badge>
                  <Badge className="bg-destructive/10 text-destructive border-0">{absentStudents.length} Absent</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {mockStudents.map((student) => (
                    <div key={student.id} className={`rounded-xl border p-3 flex items-center gap-3 transition-all hover:shadow-sm ${
                      student.status === "present" ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
                    }`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        student.status === "present" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}>
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${
                            student.status === "present" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          }`}>
                            {student.status === "present" ? "Present" : "Absent"}
                          </Badge>
                          {student.confidence > 0 && (
                            <span className="text-[10px] text-muted-foreground">{student.confidence}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="gradient-primary text-primary-foreground border-0" onClick={() => toast({ title: "Attendance Confirmed", description: "Attendance has been saved successfully." })}>
                <Check className="h-4 w-4 mr-2" /> Confirm Attendance
              </Button>
              <Button variant="outline" onClick={() => { setPhase("upload"); setPreview(null); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-scan
              </Button>
              <Button variant="outline" onClick={() => toast({ title: "Report Downloaded" })}>
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
