import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, RefreshCw, Download, Scan, UserCheck, UserX, Clock, X, Sparkles, Zap } from "lucide-react";
import { mockStudents } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

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
                  className={`border-2 border-dashed rounded-2xl p-14 text-center transition-all cursor-pointer relative overflow-hidden ${
                    dragOver ? "border-primary bg-primary/5 shadow-[inset_0_0_30px_hsl(var(--primary)/0.05)]" : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                  }`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  {dragOver && <div className="absolute inset-0 bg-primary/5 animate-shimmer" />}
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
                  <p className="text-sm font-semibold text-foreground">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG up to 10MB</p>
                </div>
                {preview && (
                  <div className="mt-4 relative rounded-xl overflow-hidden shadow-lg">
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-lg backdrop-blur-sm"
                      onClick={() => setPreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  className="w-full mt-4 h-11 gradient-primary text-primary-foreground border-0 font-semibold shadow-lg shadow-primary/20"
                  disabled={!preview}
                  onClick={simulateProcessing}
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
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
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      i < currentStep ? "bg-success text-success-foreground shadow-md shadow-success/20" :
                      i === currentStep ? "gradient-primary text-primary-foreground shadow-md shadow-primary/30" :
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
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Recognized", value: presentStudents.length, color: "from-primary/15 to-purple-500/10", icon: UserCheck, iconColor: "text-primary" },
                { label: "Absent", value: absentStudents.length, color: "from-red-500/15 to-orange-400/10", icon: UserX, iconColor: "text-destructive" },
                { label: "Avg. Confidence", value: "96.2%", color: "from-emerald-500/15 to-green-400/10", icon: Check, iconColor: "text-success" },
                { label: "Timestamp", value: "Now", color: "from-amber-500/15 to-yellow-400/10", icon: Clock, iconColor: "text-warning" },
              ].map((item) => (
                <Card key={item.label} className="card-elevated overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
                  <CardContent className="p-4 text-center relative">
                    <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.iconColor}`} />
                    <p className="text-2xl font-extrabold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Student cards */}
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold">Attendance Results</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-success/10 text-success border-0 font-semibold">{presentStudents.length} Present</Badge>
                  <Badge className="bg-destructive/10 text-destructive border-0 font-semibold">{absentStudents.length} Absent</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {mockStudents.map((student) => (
                    <div key={student.id} className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
                      student.status === "present" ? "border-success/20 bg-success/5 hover:bg-success/10" : "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                    }`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm ${
                        student.status === "present" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}>
                        {student.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${
                            student.status === "present" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          }`}>
                            {student.status === "present" ? "Present" : "Absent"}
                          </Badge>
                          {student.confidence > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">{student.confidence}%</span>
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
              <Button className="gradient-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 font-semibold" onClick={() => toast({ title: "✅ Attendance Confirmed", description: "Attendance has been saved successfully." })}>
                <Check className="h-4 w-4 mr-2" /> Confirm Attendance
              </Button>
              <Button variant="outline" className="font-medium" onClick={() => { setPhase("upload"); setPreview(null); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-scan
              </Button>
              <Button variant="outline" className="font-medium" onClick={() => toast({ title: "📥 Report Downloaded" })}>
                <Download className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
