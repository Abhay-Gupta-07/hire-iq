import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  FileText, 
  Award, 
  Calendar, 
  Play, 
  Database, 
  PieChart, 
  User, 
  TrendingUp, 
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Film,
  Tv,
  Activity,
  Video,
  Users,
  Sliders,
  Link,
  Check,
  Copy,
  Sun,
  Moon,
  FileSpreadsheet,
  Mail,
  Send,
  Loader2,
  Upload
} from "lucide-react";
import * as XLSX from "xlsx";
import { Interview, ResumeData, UserProfile } from "../types";
import { mockDb } from "../lib/mockDb";
import HireIqLogo from "./HireIqLogo";
import DashboardVideoViewer from "./DashboardVideoViewer";
import AdminLiveStreamMonitor from "./AdminLiveStreamMonitor";

interface DashboardProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

export default function Dashboard({ onNavigate, onLogout, theme = "dark", toggleTheme }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeCategory, setActiveCategory] = useState<"pending" | "shortlisted" | "rejected">("pending");

  // Decoupled Confirmation Dialog State to bypass iFrame modal-blocking constraints
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "interview" | "resume";
    name?: string;
  } | null>(null);

  // Toggled interview ID for watching videos directly in dashboard
  const [expandedReviewSessionId, setExpandedReviewSessionId] = useState<string | null>(null);

  // Real-time Administrator Radar Tracking States
  const [liveSessionState, setLiveSessionState] = useState<{
    interviewId: string;
    candidateName: string;
    role: string;
    currentQuestion: string;
    currentQuestionIdx: number;
    totalQuestions: number;
    recordingState: string;
    cameraActive: boolean;
    liveSpeechText: string;
    interimSpeechText: string;
    lastActive: number;
  } | null>(null);
  
  const [liveCameraFrame, setLiveCameraFrame] = useState<string | null>(null);
  const [showLiveMonitorPanel, setShowLiveMonitorPanel] = useState(false);

  // Advanced Bulk Simulation States
  const [isBulkSimulationActive, setIsBulkSimulationActive] = useState(false);
  const [bulkSimulationCount, setBulkSimulationCount] = useState(150);
  const [showBulkSetupModal, setShowBulkSetupModal] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [bulkInviteCopied, setBulkInviteCopied] = useState(false);

  // Excel Candidate Import States
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRawRows, setExcelRawRows] = useState<any[]>([]);
  const [excelCandidates, setExcelCandidates] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelEmailCol, setExcelEmailCol] = useState<string>("");
  const [excelNameCol, setExcelNameCol] = useState<string>("");
  const [excelRoleCol, setExcelRoleCol] = useState<string>("");
  const [excelDragged, setExcelDragged] = useState(false);
  const [isAnalyzingExcel, setIsAnalyzingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<"idle" | "sending" | "done">("idle");
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  // Re-parse when selectors change or raw lines change
  useEffect(() => {
    if (excelRawRows.length === 0) return;

    const list = excelRawRows.map((row: any) => {
      const emailVal = String(row[excelEmailCol] || "").trim();
      const nameVal = String(row[excelNameCol] || "").trim();
      const roleVal = excelRoleCol ? String(row[excelRoleCol] || "").trim() : "";

      return {
        name: nameVal || "Anonymous Candidate",
        email: emailVal,
        role: roleVal || "Software Engineer"
      };
    }).filter(item => item.email && item.email.includes("@"));

    setExcelCandidates(list);
    localStorage.setItem("excel_candidates_imported", JSON.stringify(list));

    const recommendedSize = Math.min(500, Math.max(5, list.length));
    setBulkSimulationCount(recommendedSize);
  }, [excelRawRows, excelEmailCol, excelNameCol, excelRoleCol]);

  // Parse Excel, CSV or JSON File
  const handleParseExcel = (file: File) => {
    setExcelFile(file);
    setIsAnalyzingExcel(true);
    setExcelError(null);
    setExcelCandidates([]);
    setExcelRawRows([]);
    setSendingLogs([]);
    setInvitationStatus("idle");
    setSuccessCount(0);

    const isJson = file.name.toLowerCase().endsWith(".json");

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          let rawRows: any[] = [];
          if (Array.isArray(parsed)) {
            rawRows = parsed;
          } else if (parsed && typeof parsed === "object") {
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
              rawRows = parsed[arrayKey];
            } else {
              rawRows = [parsed];
            }
          }

          if (rawRows.length === 0) {
            throw new Error("No arrays or objects found in the JSON file.");
          }

          const headers = Object.keys(rawRows[0]);
          setExcelHeaders(headers);

          // Advanced match scoring for Name, Email and Role keys
          const emailCol = headers.find(h => /email|mail|e-mail/i.test(h)) || headers[0] || "";
          const nameCol = headers.find(h => /name|cand|full_name|first_name|person/i.test(h)) || headers[1] || headers[0] || "";
          const roleCol = headers.find(h => /role|job|position|title/i.test(h)) || "";

          setExcelEmailCol(emailCol);
          setExcelNameCol(nameCol);
          setExcelRoleCol(roleCol);

          setExcelRawRows(rawRows);
          setIsAnalyzingExcel(false);
        } catch (err: any) {
          console.error(err);
          setExcelError(err.message || "Failed to analyze JSON submissions. Please check column or element structure.");
          setIsAnalyzingExcel(false);
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        if (workbook.SheetNames.length === 0) {
          throw new Error("The Excel workbook does not contain any sheets.");
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        if (rawJson.length === 0) {
          throw new Error("The Excel sheet is empty or has no row items.");
        }

        const headers = Object.keys(rawJson[0]);
        setExcelHeaders(headers);

        const emailCol = headers.find(h => /email|mail|e-mail/i.test(h)) || headers[0] || "";
        const nameCol = headers.find(h => /name|cand|full_name|first_name|person/i.test(h)) || headers[1] || headers[0] || "";
        const roleCol = headers.find(h => /role|job|position|title/i.test(h)) || "";

        setExcelEmailCol(emailCol);
        setExcelNameCol(nameCol);
        setExcelRoleCol(roleCol);

        setExcelRawRows(rawJson);
        setIsAnalyzingExcel(false);
      } catch (err: any) {
        console.error(err);
        setExcelError(err.message || "Failed to analyze Excel file. Please ensure correct rows and column headers.");
        setIsAnalyzingExcel(false);
      }
    };

    reader.onerror = () => {
      setExcelError("File reader error. Could not read binary block.");
      setIsAnalyzingExcel(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Dispatch Invitation Broadcast Simulation
  const handleDispatchInvitations = () => {
    if (excelCandidates.length === 0) return;
    setIsSendingInvitations(true);
    setInvitationStatus("sending");
    setSendingLogs(["Initializing real-time mail server connection..."]);
    setSuccessCount(0);

    const candidatesToInvite = [...excelCandidates];

    // Staggered simulation to make it absolutely premium, live and visually thrilling!
    const runStaggeredInvitation = (idx: number) => {
      if (idx >= candidatesToInvite.length) {
        setSendingLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✔ Automated invitation delivery campaign completed successfully.`,
          `[${new Date().toLocaleTimeString()}] Total dispatched invites: ${candidatesToInvite.length}`,
          `[${new Date().toLocaleTimeString()}] Candidate list synchronized for surveillance.`
        ]);
        setInvitationStatus("done");
        setIsSendingInvitations(false);
        return;
      }

      const candidate = candidatesToInvite[idx];
      
      setSendingLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Resolving MX Records for ${candidate.email}...`,
      ]);

      setTimeout(() => {
        setSendingLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] SMTP handshakes established with TLSv1.3. Dispatching unique invitation link...`,
        ]);
        
        setTimeout(() => {
          setSendingLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ✔ Secure delivery packet sent to ${candidate.name} <${candidate.email}> (Delivery confirmation code: 250 OK)`,
          ]);
          setSuccessCount(idx + 1);
          runStaggeredInvitation(idx + 1);
        }, 120); // Faster staggered pace for crisp user experience

      }, 80);
    };

    runStaggeredInvitation(0);
  };

  // Cross-tab standard BroadcastChannel communication
  useEffect(() => {
    const channel = new BroadcastChannel("vocal_ai_live_stream");

    channel.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      const { type, interviewId, frame, ...payload } = data;

      if (type === "session_info" || type === "speech_update") {
        setLiveSessionState((prev) => {
          if (type === "speech_update" && prev?.interviewId !== interviewId) {
            return prev;
          }
          return {
            interviewId,
            candidateName: payload.candidateName || prev?.candidateName || "Alex Rodriguez",
            role: payload.role || prev?.role || "Software Engineer",
            currentQuestion: payload.currentQuestion || prev?.currentQuestion || "",
            currentQuestionIdx: payload.currentQuestionIdx ?? prev?.currentQuestionIdx ?? 1,
            totalQuestions: payload.totalQuestions ?? prev?.totalQuestions ?? 3,
            recordingState: payload.recordingState ?? prev?.recordingState ?? "idle",
            cameraActive: payload.cameraActive ?? prev?.cameraActive ?? false,
            liveSpeechText: payload.liveSpeechText ?? prev?.liveSpeechText ?? "",
            interimSpeechText: payload.interimSpeechText ?? prev?.interimSpeechText ?? "",
            lastActive: Date.now()
          };
        });
        
        // Auto-show radar beacon if there is a newly active stream
        if (type === "session_info") {
          setShowLiveMonitorPanel(true);
        }
      } else if (type === "camera_frame") {
        setLiveSessionState((prev) => {
          if (!prev || prev.interviewId !== interviewId) return prev;
          return { ...prev, lastActive: Date.now() };
        });
        setLiveCameraFrame(frame);
      } else if (type === "session_ended") {
        setLiveSessionState((prev) => {
          if (prev && prev.interviewId === interviewId) {
            return null;
          }
          return prev;
        });
        setLiveCameraFrame(null);
      }
    };

    // Keepalive checking interval - clear signal if idle for over 15 seconds
    const staleInterval = setInterval(() => {
      setLiveSessionState((prev) => {
        if (prev && Date.now() - prev.lastActive > 15000) {
          setLiveCameraFrame(null);
          return null;
        }
        return prev;
      });
    }, 5000);

    return () => {
      channel.close();
      clearInterval(staleInterval);
    };
  }, []);

  useEffect(() => {
    // Initial fetch from mockDb
    setProfile(mockDb.getProfile());
    setInterviews(mockDb.getInterviews());
    setResumes(mockDb.getResumes());
  }, []);

  // Compute stat metrics
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === "completed");
  const averageScore = completedInterviews.length > 0
    ? Math.round(
        completedInterviews.reduce((acc, curr) => {
          const report = mockDb.getReportByInterviewId(curr.id);
          return acc + (report ? report.overall_score : 70); 
        }, 0) / completedInterviews.length
      )
    : 0;

  const handleUpdateName = (newName: string) => {
    if (!newName.trim() || !profile) return;
    const updated = { ...profile, full_name: newName };
    mockDb.updateProfile(updated);
    setProfile(updated);
  };

  // Confirm actions via non-blocking custom modal instead of sandboxed browser confirm()
  const handleDeleteResume = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const resume = resumes.find(r => r.id === id);
    setDeleteTarget({
      id,
      type: "resume",
      name: resume?.filename || "this resume record"
    });
  };

  const handleDeleteInterview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const interview = interviews.find(i => i.id === id);
    setDeleteTarget({
      id,
      type: "interview",
      name: interview ? `${interview.candidate_name} — ${interview.role}` : "this interview record"
    });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    if (type === "resume") {
      mockDb.deleteResume(id);
      setResumes(mockDb.getResumes());
    } else {
      mockDb.deleteInterview(id);
      setInterviews(mockDb.getInterviews());
      // Minimize video accordion if active
      if (expandedReviewSessionId === id) {
        setExpandedReviewSessionId(null);
      }
    }
    setDeleteTarget(null);
  };

  const handleUpdateDecision = (id: string, decision: "pending" | "shortlisted" | "rejected") => {
    const intv = interviews.find(i => i.id === id);
    if (!intv) return;
    const updated = { ...intv, decision };
    mockDb.updateInterview(updated);
    setInterviews(mockDb.getInterviews());
  };

  const isLight = theme === "light";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isLight ? "bg-transparent text-[#131518]" : "bg-slate-950 text-slate-100"}`}>
      {/* Background Grids */}
      {!isLight && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
      )}

      {/* Main Container Header */}
      <nav className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-500 ${
        isLight ? "border-slate-200/50 bg-[#f8f8f6]/85" : "border-slate-900 bg-slate-900/30"
      }`}>
        <div className="w-full max-w-[90rem] mx-auto px-6 sm:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer animate-pulse-slow" onClick={() => onNavigate("/")}>
            <HireIqLogo theme={theme} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 border-r pr-4 ${isLight ? "border-slate-200" : "border-slate-850"}`}>
              <img 
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"} 
                alt="Profile Avatar" 
                className={`w-7 h-7 rounded-full border ${isLight ? "border-slate-300" : "border-slate-700"}`}
              />
              <input
                id="profile_name_input"
                type="text"
                value={profile?.full_name || ""}
                onChange={(e) => handleUpdateName(e.target.value)}
                title="Click to rename"
                className={`bg-transparent border-0 text-xs font-semibold h-7 px-2 rounded focus:outline-none w-28 text-ellipsis cursor-pointer transition-colors ${
                  isLight ? "hover:bg-black/5 focus:bg-slate-200/50 text-[#131518]" : "hover:bg-slate-900 focus:bg-slate-900 text-slate-200"
                }`}
              />
            </div>

            <button
              id="btn_dashboard_logout"
              onClick={onLogout}
              className={`text-[10px] font-mono tracking-wider uppercase transition-colors shrink-0 ${
                isLight ? "text-slate-600 hover:text-rose-500" : "text-slate-400 hover:text-rose-400"
              }`}
            >
              Log Out
            </button>

            {toggleTheme && (
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isLight 
                    ? "border-black/15 bg-black/5 text-[#131518] hover:bg-black/10" 
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* DASHBOARD GRID */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10 relative z-10">
        
        {/* Welcome Area Card */}
        <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative transition-all duration-550 ${
          isLight ? "bg-white border-slate-200 shadow-md text-slate-800" : "bg-gradient-to-r from-slate-900 to-slate-900/40 border-slate-800/80 text-slate-100"
        }`}>
          <div className="absolute -right-20 -bottom-20 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono ${
              isLight ? "bg-emerald-50 text-emerald-700 border border-emerald-250/20" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}>
              <Sparkles className={`w-3 h-3 ${isLight ? "text-emerald-600 animate-pulse" : "text-emerald-400"}`} />
              Ready for Sandbox Practice Runs
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>
              Welcome back, {profile?.full_name || "Candidate"}
            </h1>
            <p className={`text-xs sm:text-sm max-w-xl font-light ${isLight ? "text-slate-600/90" : "text-slate-400"}`}>
              Review your indexed accomplishments, refine keywords via parsed resume analyzers, and run interactive interviews out loud.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              id="btn_dash_resume"
              onClick={() => onNavigate("/app/resume")}
              className={`flex-1 md:flex-initial h-11 px-5 rounded-xl border text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLight 
                  ? "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:text-black" 
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              Manage Resumes
            </button>

            <button
              id="btn_dash_new_interview"
              onClick={() => onNavigate("/app/interview/new")}
              className="flex-1 md:flex-initial h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold tracking-tight transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              New Interview
            </button>

            <button
              id="btn_dash_bulk_interview"
              onClick={() => setShowBulkSetupModal(true)}
              className="flex-1 md:flex-initial h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-tight transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/30"
              title="Stress-test cockpit with multiple simulated high-fidelity interviews at once"
            >
              <Users className="w-4 h-4 text-indigo-100" />
              Bulk Interview
            </button>
          </div>
        </div>

        {/* RECRUITER REAL-TIME STREAMING PORTAL */}
        <section id="recruiter_live_surveillance_section" className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-slate-900"}`}>
            <div className="flex items-center gap-2">
              <Tv className={`w-4 h-4 animate-pulse ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
              <h2 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Live Watching Surveillance Cockpit</h2>
            </div>
            <span className="text-xs text-rose-500 font-mono flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              RADAR ACTIVE
            </span>
          </div>

          <AnimatePresence mode="wait">
            {isBulkSimulationActive ? (
              showLiveMonitorPanel ? (
                <AdminLiveStreamMonitor
                  key="live_active_cockpit"
                  liveSession={{
                    interviewId: "bulk-sim-session",
                    candidateName: "Massive Cohort",
                    role: "AI Simulation",
                    currentQuestion: "Simulation Running...",
                    currentQuestionIdx: 1,
                    totalQuestions: 3,
                    recordingState: "listening",
                    cameraActive: true,
                    liveSpeechText: "",
                    interimSpeechText: "",
                    lastActive: Date.now()
                  }}
                  liveCameraFrame={null}
                  isBulkMode={isBulkSimulationActive}
                  bulkCount={bulkSimulationCount}
                  onClose={() => {
                    setIsBulkSimulationActive(false);
                    setShowLiveMonitorPanel(false);
                  }}
                />
              ) : (
                <motion.div
                  key="live_bulk_preview_card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-6 border rounded-2xl flex flex-col lg:flex-row items-stretch justify-between gap-6 transition-all ${
                    isLight ? "bg-white border-slate-200 shadow-md text-slate-800" : "bg-slate-900/60 border-slate-850"
                  }`}
                >
                  <div className="flex-1 flex flex-col md:flex-row gap-5">
                    <div className={`w-full md:w-48 aspect-video rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center border ${
                      isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-850"
                    }`}>
                      <div className="text-center p-3 animate-pulse">
                        <Users className={`w-8 h-8 mx-auto ${isLight ? "text-indigo-600" : "text-indigo-400"}`} />
                        <span className={`text-[9px] font-mono uppercase block mt-2 ${isLight ? "text-indigo-850 font-bold" : "text-indigo-300"}`}>Active Streams Grid</span>
                      </div>
                      <span className="absolute top-2 left-2 bg-indigo-505 text-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
                        SIMULATED
                      </span>
                    </div>

                    <div className="space-y-2 text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded uppercase font-semibold ${
                          isLight ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        }`}>
                          Advanced Stress Test
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? "text-black font-semibold" : "text-indigo-400"}`}>
                          Cohort Size: {bulkSimulationCount} Candidates
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold font-display ${isLight ? "text-slate-950" : "text-white"}`}>
                        Robotic Cohort Simulated Panel &mdash; <span className={isLight ? "text-black font-normal" : "font-light text-slate-400"}>All streams active</span>
                      </h4>
                      <p className={`text-xs leading-relaxed font-light ${isLight ? "text-black" : "text-slate-400"}`}>
                        Massive parallel evaluation of {bulkSimulationCount} biometric audio and video feeds. Track alert thresholds, transcription feeds, and response coherence indices concurrently.
                      </p>
                    </div>
                  </div>

                  <div className={`w-full lg:w-96 p-4 rounded-xl border flex flex-col justify-between gap-3 text-left ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-850/60"
                  }`}>
                    <div className="space-y-1">
                      <span className={`text-[9.5px] font-mono block font-bold uppercase tracking-wider ${isLight ? "text-indigo-700" : "text-indigo-400"}`}>Simulated Surveillance Telemetry</span>
                      <p className={`text-[11px] italic leading-relaxed ${isLight ? "text-black" : "text-slate-400"}`}>
                        Surveillance cockpit running parallel simulations of {bulkSimulationCount} mock interviews in real-time. Unmute any feed to hear live vocal dictation!
                      </p>
                    </div>

                    <div className={`space-y-2 p-2.5 rounded-lg border ${isLight ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-850"}`}>
                      <span className={`text-[9px] font-mono block font-bold uppercase tracking-[0.05em] ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
                        Multi-User Shared Invite link:
                      </span>
                      <div className={`flex border rounded-lg p-0.5 items-center gap-1.5 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"}`}>
                        <input
                          type="text"
                          readOnly
                          id="txt_bulk_invite_active_link"
                          value={`${window.location.origin}/invite/bulk-sim-session`}
                          className={`flex-1 bg-transparent px-2 text-[10px] font-mono focus:outline-none truncate select-all ${isLight ? "text-emerald-700 font-semibold" : "text-emerald-400"}`}
                        />
                        <button
                          type="button"
                          id="btn_copy_bulk_invite_active_link"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/bulk-sim-session`);
                            setBulkInviteCopied(true);
                            setTimeout(() => {
                              setBulkInviteCopied(false);
                            }, 2000);
                          }}
                          className={`h-7 px-2.5 rounded font-mono text-[9px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                            bulkInviteCopied 
                              ? "bg-emerald-500 text-slate-150 font-black animate-pulse" 
                              : isLight ? "bg-white border border-slate-200 hover:bg-slate-100 text-black" : "bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                          }`}
                        >
                          {bulkInviteCopied ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLiveMonitorPanel(true)}
                        className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        <Tv className="w-3.5 h-3.5 text-white" />
                        Open Surveillance Cockpit
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            ) : liveSessionState ? (
              showLiveMonitorPanel ? (
                <AdminLiveStreamMonitor
                  key="live_active_cockpit"
                  liveSession={liveSessionState}
                  liveCameraFrame={liveCameraFrame}
                  isBulkMode={false}
                  bulkCount={0}
                  onClose={() => setShowLiveMonitorPanel(false)}
                />
              ) : (
                <motion.div
                  key="live_active_preview_card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-6 border rounded-2xl flex flex-col lg:flex-row items-stretch justify-between gap-6 transition-all ${
                    isLight ? "bg-white border-slate-200 shadow-md text-slate-800" : "bg-slate-900/60 border-slate-850"
                  }`}
                >
                  {/* Left: Thumbnail/Metadata */}
                  <div className="flex-1 flex flex-col md:flex-row gap-5">
                    {/* Live webcam feed mini screen thumbnail */}
                    <div className={`w-full md:w-48 aspect-video rounded-xl overflow-hidden relative shrink-0 border ${
                      isLight ? "bg-slate-50 border-slate-205" : "bg-black border-slate-850"
                    }`}>
                      {liveSessionState.cameraActive && liveCameraFrame ? (
                        <img
                          src={liveCameraFrame}
                          alt="Live Thumbnail"
                          className="w-full h-full object-cover select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${isLight ? "bg-slate-50" : "bg-slate-950"}`}>
                          <Video className="w-6 h-6 text-slate-405 animate-pulse" />
                          <span className="text-[8px] font-mono text-slate-505 mt-1 uppercase">No video stream</span>
                        </div>
                      )}
                      
                      {/* Live flashing tag */}
                      <span className="absolute top-2 left-2 bg-rose-500 text-white font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live Feed
                      </span>
                    </div>

                    {/* Metadata summary */}
                    <div className="space-y-2 text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded uppercase ${
                          isLight ? "bg-rose-50 text-rose-700 border-rose-220" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          Candidate Active
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? "text-black" : "text-slate-500"}`}>
                          Channel ID: vocal_ai_live_stream
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold font-display ${isLight ? "text-slate-950" : "text-white"}`}>
                        {liveSessionState.candidateName} &mdash; <span className={isLight ? "text-black font-normal" : "font-light text-slate-405"}>{liveSessionState.role}</span>
                      </h4>
                      
                      <p className={`text-xs leading-relaxed font-light line-clamp-2 ${isLight ? "text-black" : "text-slate-400"}`}>
                        <span className={`font-semibold ${isLight ? "text-black" : "text-slate-300"}`}>Question {liveSessionState.currentQuestionIdx}:</span> &ldquo;{liveSessionState.currentQuestion}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Transcript snippets and action */}
                  <div className={`w-full lg:w-96 p-4 rounded-xl border flex flex-col justify-between gap-3 text-left ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-850/60"
                  }`}>
                    <div className="space-y-1">
                      <span className={`text-[9.5px] font-mono uppercase tracking-widest block font-bold ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>Transcription Stream</span>
                      <p className={`text-[11px] italic line-clamp-3 leading-relaxed ${isLight ? "text-black" : "text-slate-400"}`}>
                        {liveSessionState.liveSpeechText || liveSessionState.interimSpeechText ? (
                          <>
                            {liveSessionState.liveSpeechText}
                            {liveSessionState.interimSpeechText && <span className="text-emerald-600 text-xs animate-pulse font-semibold"> {liveSessionState.interimSpeechText}...</span>}
                          </>
                        ) : (
                          "[Silence detected. Ready for candidate voice input...]"
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="btn_admin_peek_live"
                        onClick={() => setShowLiveMonitorPanel(true)}
                        className="flex-1 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Tv className="w-3.5 h-3.5 text-slate-950" />
                        Open Live Monitor Panel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="live_idle_card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-6 border rounded-2xl flex flex-col md:flex-row items-center gap-6 text-left relative overflow-hidden transition-all ${
                  isLight ? "bg-white border-slate-205 shadow-md" : "bg-slate-900/10 border-slate-855/80"
                }`}
              >
                {/* Visual Radar Locator Animation Panel */}
                <div className={`w-24 h-24 shrink-0 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner border transition-all ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-emerald-500/10"
                }`}>
                  {/* Concentric rings */}
                  <div className="absolute inset-2 rounded-full border border-emerald-555/5" />
                  <div className="absolute inset-4 rounded-full border border-emerald-555/5 animate-pulse" />
                  <div className="absolute inset-8 rounded-full border border-emerald-555/5" />
                  
                  {/* Sweep arm */}
                  <div className="absolute top-1/2 left-1/2 w-12 h-0.5 bg-gradient-to-r from-emerald-500/40 to-transparent origin-left -translate-y-1/2 rounded animate-[spin_5s_linear_infinite]" />
                  
                  {/* Center glowing node */}
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/55 animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow relative" />
                </div>

                <div className="space-y-2 flex-1 relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-[9px] border px-2 py-0.5 rounded uppercase tracking-wider ${
                      isLight ? "bg-slate-100 border-slate-200 text-slate-700 font-semibold" : "bg-slate-900 border border-slate-800 text-slate-400"
                    }`}>
                      origin node: connected
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LISTENING FOR SYNC...
                    </span>
                  </div>
                  
                  <h3 className={`text-sm font-semibold font-sans ${isLight ? "text-slate-950" : "text-white"}`}>
                    Recruiter Live Observation Portal
                  </h3>

                  <p className={`text-xs leading-relaxed font-light max-w-2xl ${isLight ? "text-slate-700" : "text-slate-400"}`}>
                    This advanced telemetry cockpit utilizes standardized browser synchronization to mirror high-fidelity interview session streams in real-time. To test visual surveillance and live audio transcripts, simply **Open the Practice Room in another browser tab or tab-group** and begin speaking. The cockpit automatically activates to stream raw analytics here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* M1 */}
          <div className={`p-5 rounded-xl border flex items-center gap-4 transition-all ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${isLight ? "text-black font-semibold" : "text-slate-500"}`}>Total Interviews</span>
              <span className={`text-lg font-bold mt-0.5 block ${isLight ? "text-slate-950" : "text-white"}`}>{totalInterviews}</span>
            </div>
          </div>

          {/* M2 */}
          <div className={`p-5 rounded-xl border flex items-center gap-4 transition-all ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isLight ? "bg-teal-50 text-teal-600" : "bg-teal-500/10 text-teal-400"
            }`}>
              <Award className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${isLight ? "text-black font-semibold" : "text-slate-500"}`}>Average Rating</span>
              <span className={`text-lg font-bold mt-0.5 block ${isLight ? "text-slate-950" : "text-white"}`}>
                {averageScore > 0 ? `${averageScore}%` : "N/A"}
              </span>
            </div>
          </div>

          {/* M3 */}
          <div className={`p-5 rounded-xl border flex items-center gap-4 transition-all ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400"
            }`}>
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${isLight ? "text-black font-semibold" : "text-slate-500"}`}>Indexed Resumes</span>
              <span className={`text-lg font-bold mt-0.5 block ${isLight ? "text-slate-950" : "text-white"}`}>{resumes.length}</span>
            </div>
          </div>

          {/* M4 */}
          <div className={`p-5 rounded-xl border flex items-center gap-4 transition-all ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${isLight ? "text-black font-semibold" : "text-slate-500"}`}>Readiness Rate</span>
              <span className={`text-lg font-bold mt-0.5 block ${isLight ? "text-slate-950" : "text-white"}`}>
                {averageScore > 80 ? "High" : averageScore > 0 ? "Standard" : "N/A"}
              </span>
            </div>
          </div>
        </div>        {/* RECENT INTERVIEWS */}
        <section className="space-y-4">
          {(() => {
            const pendingCandidates = interviews.filter(i => i.status !== "completed" || i.decision === "pending" || !i.decision);
            const shortlistedCandidates = interviews.filter(i => i.status === "completed" && i.decision === "shortlisted");
            const rejectedCandidates = interviews.filter(i => i.status === "completed" && i.decision === "rejected");

            const filteredInterviews = activeCategory === "shortlisted"
              ? shortlistedCandidates
              : activeCategory === "rejected"
              ? rejectedCandidates
              : pendingCandidates;

            return (
              <>
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3 ${
                  isLight ? "border-slate-200" : "border-slate-900"
                }`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
                    <h2 className={`text-base font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Interview Practice Logs</h2>
                  </div>

                  {/* Funnel Pipeline Tabs */}
                  <div className={`flex rounded-lg p-1 text-[11px] self-start md:self-auto shrink-0 space-x-1 font-mono border ${
                    isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-900"
                  }`}>
                    <button
                      id="btn_pipeline_pending"
                      onClick={() => setActiveCategory("pending")}
                      className={`px-3 py-1.5 rounded-md uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeCategory === "pending"
                          ? isLight 
                            ? "bg-white text-emerald-700 font-extrabold shadow-sm" 
                            : "bg-slate-900 text-emerald-400 font-extrabold shadow-md"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Pending ({pendingCandidates.length})
                    </button>

                    <button
                      id="btn_pipeline_shortlisted"
                      onClick={() => setActiveCategory("shortlisted")}
                      className={`px-3 py-1.5 rounded-md uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeCategory === "shortlisted"
                          ? isLight 
                            ? "bg-white text-teal-700 font-extrabold shadow-sm" 
                            : "bg-slate-900 text-teal-400 font-extrabold shadow-md"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Shortlisted ({shortlistedCandidates.length})
                    </button>

                    <button
                      id="btn_pipeline_rejected"
                      onClick={() => setActiveCategory("rejected")}
                      className={`px-3 py-1.5 rounded-md uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        activeCategory === "rejected"
                          ? isLight 
                            ? "bg-white text-rose-700 font-extrabold shadow-sm" 
                            : "bg-slate-900 text-rose-400 font-extrabold shadow-md"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Rejected ({rejectedCandidates.length})
                    </button>
                  </div>
                </div>

                {filteredInterviews.length === 0 ? (
                  <div className={`rounded-xl border border-dashed p-12 text-center space-y-3 transition-all ${
                    isLight ? "border-slate-300 bg-white shadow-sm" : "border-slate-800 bg-slate-900/10"
                  }`}>
                    <ShieldAlert className={`w-8 h-8 mx-auto ${isLight ? "text-slate-400" : "text-slate-600"}`} />
                    <div>
                      <h4 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                        {activeCategory === "shortlisted"
                          ? "No shortlisted candidates"
                          : activeCategory === "rejected"
                          ? "No rejected candidates"
                          : "No pending candidate sessions"}
                      </h4>
                      <p className={`text-xs mt-1 max-w-sm mx-auto ${isLight ? "text-black" : "text-slate-505"}`}>
                        {activeCategory === "shortlisted"
                          ? "Browse the pending candidate log list and select Shortlist to recommend hire."
                          : activeCategory === "rejected"
                          ? "Candidate results have not been categorised into rejection lists."
                          : "To begin practicing, upload a resume or use optimized job setups, then launch a free vocal room."}
                      </p>
                    </div>
                    {activeCategory === "pending" && (
                      <button
                        id="btn_no_int_new"
                        onClick={() => onNavigate("/app/interview/new")}
                        className="h-9 px-4 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition-colors"
                      >
                        Create First Session
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInterviews.map((interview) => {
                      const report = mockDb.getReportByInterviewId(interview.id);
                      const hasReport = !!report;
                      const formattedDate = new Date(interview.started_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      return (
                        <div key={interview.id} className="space-y-2">
                          <motion.div
                            id={`interview_row_${interview.id}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group text-left ${
                              isLight ? "bg-white border-slate-200 hover:border-slate-300 shadow-md" : "bg-slate-900/30 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="space-y-1.5 flex-1 w-full min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold font-display ${isLight ? "text-slate-950" : "text-white"}`}>
                                  {interview.candidate_name} &mdash; {interview.role}
                                </span>
                                
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                                  interview.difficulty === "hard" 
                                    ? isLight ? "bg-red-50 text-red-700 border-red-200" : "bg-red-500/10 text-red-400 border border-red-500/15" 
                                    : interview.difficulty === "medium" 
                                    ? isLight ? "bg-amber-50 text-amber-750 border-amber-200" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                    : isLight ? "bg-emerald-50 text-emerald-700 border-emerald-250" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                }`}>
                                  {interview.difficulty}
                                </span>

                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                                  interview.status === "completed"
                                    ? isLight ? "bg-emerald-50 text-emerald-700 border-emerald-250" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                    : isLight ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                                }`}>
                                  {interview.status}
                                </span>

                                {interview.resume_filename && (
                                  <span className={`text-[9px] font-mono truncate max-w-[150px] px-2 py-0.5 rounded border ${
                                    isLight ? "bg-slate-50 border-slate-200 text-black" : "bg-slate-950 border-slate-900 text-slate-505"
                                  }`} title={interview.resume_filename}>
                                    📄 {interview.resume_filename}
                                  </span>
                                )}
                              </div>

                              <div className={`flex items-center gap-4 text-[10px] font-mono ${isLight ? "text-black" : "text-slate-500"}`}>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formattedDate}
                                </span>
                                <span>Questions: {interview.total_questions}</span>
                                {interview.status === "in_progress" && (
                                  <span className={isLight ? "text-blue-700 font-bold" : "text-blue-400"}>Current index: {interview.current_question_idx + 1}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center flex-wrap sm:flex-nowrap">
                              {interview.status === "completed" && report && (
                                <div className="text-right mr-2 hidden sm:block">
                                  <span className={`text-[10px] font-mono uppercase ${isLight ? "text-black" : "text-slate-500"}`}>Overall Assessment</span>
                                  <span className={`text-xs font-bold block -mt-0.5 ${isLight ? "text-emerald-700 font-extrabold" : "text-emerald-400"}`}>
                                    {report.overall_score}% &bull; {report.recommendation}
                                  </span>
                                </div>
                              )}

                              {/* Interactive Recruiter Decision Quick Toggles */}
                              {interview.status === "completed" && (
                                <div className={`flex items-center gap-1 p-0.5 border rounded-lg shrink-0 ${
                                  isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-900"
                                }`} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    id={`btn_recruiter_sh_${interview.id}`}
                                    onClick={() => handleUpdateDecision(interview.id, "shortlisted")}
                                    className={`px-2 h-7 rounded text-[9px] font-mono uppercase tracking-wide font-bold transition-all cursor-pointer ${
                                      interview.decision === "shortlisted"
                                        ? "bg-emerald-500 text-slate-950 font-black shadow"
                                        : isLight ? "text-black hover:text-emerald-700 hover:bg-white" : "text-slate-500 hover:text-emerald-400 hover:bg-slate-900"
                                    }`}
                                    title="Recommend Shortlist"
                                  >
                                    Shortlist
                                  </button>

                                  <button
                                    id={`btn_recruiter_rj_${interview.id}`}
                                    onClick={() => handleUpdateDecision(interview.id, "rejected")}
                                    className={`px-2 h-7 rounded text-[9px] font-mono uppercase tracking-wide font-bold transition-all cursor-pointer ${
                                      interview.decision === "rejected"
                                        ? "bg-rose-500 text-white font-black shadow"
                                        : isLight ? "text-black hover:text-rose-700 hover:bg-white" : "text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                                    }`}
                                    title="Recommend Reject"
                                  >
                                    Reject
                                  </button>

                                  {(interview.decision === "shortlisted" || interview.decision === "rejected") && (
                                    <button
                                      id={`btn_recruiter_reset_${interview.id}`}
                                      onClick={() => handleUpdateDecision(interview.id, "pending")}
                                      className={`w-6 h-7 font-mono text-[9px] uppercase rounded cursor-pointer ${
                                        isLight ? "text-black hover:text-slate-800 hover:bg-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                                      }`}
                                      title="Reset Status"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Watch Answer Videos Button Accordion Trigger */}
                              {interview.status === "completed" && (
                                <button
                                  id={`btn_watch_${interview.id}`}
                                  onClick={() => setExpandedReviewSessionId(expandedReviewSessionId === interview.id ? null : interview.id)}
                                  className={`h-9 px-3 rounded-lg border text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 cursor-pointer ${
                                    expandedReviewSessionId === interview.id
                                      ? isLight 
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                        : "bg-emerald-500/15 border-emerald-500/35 text-white font-bold"
                                      : isLight
                                        ? "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                                        : "border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400"
                                  }`}
                                >
                                  <Film className="w-3.5 h-3.5" />
                                  {expandedReviewSessionId === interview.id ? "Close Player" : "Watch Videos"}
                                </button>
                              )}

                              {interview.status === "completed" && hasReport && (
                                <button
                                  id={`btn_report_${interview.id}`}
                                  onClick={() => onNavigate(`/app/interview/${interview.id}/report`)}
                                  className={`h-9 px-4 rounded-lg text-xs font-semibold tracking-tight transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    isLight 
                                      ? "bg-slate-100 border border-slate-200 text-slate-850 hover:bg-slate-200 hover:text-black shadow-sm"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                  }`}
                                >
                                  View Report
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {interview.status !== "completed" && (
                                <button
                                  id={`btn_copy_invite_${interview.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/invite/${interview.id}`);
                                    setCopiedInviteId(interview.id);
                                    setTimeout(() => setCopiedInviteId(null), 2500);
                                  }}
                                  className={`h-9 px-3 rounded-lg border text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 cursor-pointer ${
                                    copiedInviteId === interview.id
                                      ? "bg-emerald-500/15 border-emerald-500/35 text-white"
                                      : isLight
                                        ? "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-705 hover:text-indigo-700"
                                        : "border-slate-800 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-300 hover:text-indigo-400"
                                  }`}
                                  title="Copy secure candidate invitation link"
                                >
                                  {copiedInviteId === interview.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                      <span className="text-emerald-600 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Link className="w-3.5 h-3.5 text-slate-500" />
                                      Copy Invite
                                    </>
                                  )}
                                </button>
                              )}

                              {interview.status === "in_progress" && (
                                <button
                                  id={`btn_resume_int_${interview.id}`}
                                  onClick={() => onNavigate(`/app/interview/${interview.id}`)}
                                  className="h-9 px-4 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold tracking-tight hover:bg-teal-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  Resume Setup
                                  <Play className="w-3" />
                                </button>
                              )}

                              <button
                                id={`btn_delete_int_${interview.id}`}
                                onClick={(e) => handleDeleteInterview(interview.id, e)}
                                className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                  isLight 
                                    ? "border-slate-300 hover:border-red-500 hover:bg-red-50 text-slate-500 hover:text-red-600"
                                    : "border-slate-900 hover:border-red-500 hover:bg-red-500/10 text-slate-600 hover:text-red-400"
                                }`}
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>

                          {/* Collapsible Dashboard Practice Video Player Accordion Panel */}
                          <AnimatePresence>
                            {expandedReviewSessionId === interview.id && (
                              <DashboardVideoViewer 
                                interviewId={interview.id} 
                                onDecisionChange={(id, decId) => handleUpdateDecision(id, decId)}
                                theme={theme}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {/* INDEXED RESUMES HISTORY */}
        <section className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-3 ${
            isLight ? "border-slate-200" : "border-slate-900"
          }`}>
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${isLight ? "text-emerald-700" : "text-emerald-400"}`} />
              <h2 className={`text-base font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Indexed Portfolio Resumes</h2>
            </div>
            <button
              id="btn_add_resume_dash"
              onClick={() => onNavigate("/app/resume")}
              className={`px-3 h-8 rounded-lg text-[11px] font-semibold border flex items-center gap-1 tracking-tight transition-all cursor-pointer ${
                isLight 
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-sm"
                  : "bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-300"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Upload New
            </button>
          </div>

          {resumes.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-8 text-center transition-all ${
              isLight ? "border-slate-300 bg-white shadow-sm" : "border-slate-800 bg-slate-900/10"
            }`}>
              <p className={`text-xs ${isLight ? "text-black" : "text-slate-500"}`}>No resumes indexed yet. Adding a resume enables ATS diagnostics and tailored questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div 
                  key={resume.id}
                  id={`resume_card_${resume.id}`}
                  className={`p-5 rounded-xl border transition-all flex justify-between gap-4 ${
                    isLight ? "bg-white border-slate-200 hover:border-slate-250 shadow-md" : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                        isLight ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      }`}>
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold line-clamp-1 truncate block max-w-[200px] ${isLight ? "text-slate-900" : "text-white"}`} title={resume.filename}>
                          {resume.filename}
                        </h4>
                        <span className={`text-[9px] font-mono uppercase block ${isLight ? "text-black" : "text-slate-500"}`}>
                          Parsed &bull; {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[9px] font-mono uppercase block ${isLight ? "text-black" : "text-slate-500"}`}>Parsed Talent Core</span>
                      <div className="flex flex-wrap gap-1">
                        {resume.parsed?.skills?.slice(0, 4).map((skill, si) => (
                          <span key={si} className={`text-[9px] border px-1.5 py-0.5 rounded ${
                            isLight ? "bg-slate-50 border-slate-200 text-black font-medium" : "bg-slate-950 border-slate-850 text-slate-300"
                          }`}>
                            {skill}
                          </span>
                        ))}
                        {(resume.parsed?.skills?.length || 0) > 4 && (
                          <span className={`text-[9px] block self-center ${isLight ? "text-black" : "text-slate-500"}`}>+{(resume.parsed?.skills?.length || 0) - 4} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                      isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border border-emerald-500/15"
                    }`}>
                      <span className={`text-xs font-bold font-mono ${isLight ? "text-emerald-750 font-extrabold" : "text-emerald-400"}`}>{resume.ats_score}</span>
                      <span className={`text-[8px] font-mono uppercase block leading-none ${isLight ? "text-emerald-600 font-semibold" : "text-emerald-500"}`}>ATS Score</span>
                    </div>

                    <button
                      id={`btn_delete_resume_${resume.id}`}
                      onClick={(e) => handleDeleteResume(resume.id, e)}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        isLight
                          ? "border-slate-300 hover:border-red-500 hover:bg-red-50 text-slate-500 hover:text-red-600"
                          : "border-slate-900 hover:border-red-500 hover:bg-rose-500/10 text-slate-605 hover:text-red-400"
                      }`}
                      title="Delete Resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Pristine Custom HTML Deletion Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            id="blk_delete_modal_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              id="blk_delete_modal_card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-left"
            >
              {/* Top Warning Banner / Header */}
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Confirm Deletion</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Irreversible Action</p>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed font-light">
                <p>
                  Are you absolutely sure you want to permanently remove this record?
                </p>
                <div className="p-3 bg-slate-950/60 border border-slate-850/80 rounded-xl font-mono text-[11px] text-slate-300 break-words">
                  <strong>{deleteTarget.name}</strong>
                </div>
                {deleteTarget.type === "interview" && (
                  <p className="text-rose-400/80 font-mono text-[10px]">
                    &bull; Warning: All recorded session video feeds, transcription streams, and AI-categorized rating reports associated with this session will be wiped out.
                  </p>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn_cancel_delete_modal"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 h-9 rounded-lg hover:bg-slate-800 text-slate-400 text-xs font-semibold tracking-tight transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn_confirm_delete_modal"
                  onClick={executeDelete}
                  className="px-4 h-9 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold tracking-tight transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Robotic Bulk Candidates Simulation Setup Modal */}
      <AnimatePresence>
        {showBulkSetupModal && (
          <motion.div
            id="blk_bulk_modal_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] overflow-y-auto p-4 md:p-6 flex items-start justify-center"
            onClick={() => setShowBulkSetupModal(false)}
          >
            <motion.div
              id="blk_bulk_modal_card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-left my-auto"
            >
              {/* Top Banner Header */}
              <div className="flex items-center gap-3 text-indigo-405">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Bulk Candidate Simulator Desk</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Deploy Massive Recruiter Surveillance Cohort</p>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed font-light">
                <p>
                  Deploy simulated high-fidelity mock candidate streams running concurrently. Stress-test your <strong>Live Watching Surveillance Cockpit</strong> with automatic real-time vocal transcript updates, audio level meters, and webcam feed renderings.
                </p>
              </div>

              {/* Range Selector Buttons inside the Modal */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                  Select Cohort Range Preset:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkSimulationCount(50)}
                    className={`p-3 rounded-xl border font-mono text-[11px] font-bold text-center transition-all cursor-pointer ${
                      bulkSimulationCount >= 1 && bulkSimulationCount <= 100
                        ? "bg-indigo-500/15 border-indigo-500/55 text-indigo-400 shadow shadow-indigo-500/10"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    1 - 100
                    <span className="block text-[8px] text-slate-500 font-light font-sans mt-0.5">Preset: 50 Streams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkSimulationCount(200)}
                    className={`p-3 rounded-xl border font-mono text-[11px] font-bold text-center transition-all cursor-pointer ${
                      bulkSimulationCount >= 101 && bulkSimulationCount <= 300
                        ? "bg-indigo-500/15 border-indigo-500/55 text-indigo-400 shadow shadow-indigo-500/10"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    101 - 300
                    <span className="block text-[8px] text-slate-500 font-light font-sans mt-0.5">Preset: 200 Streams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkSimulationCount(450)}
                    className={`p-3 rounded-xl border font-mono text-[11px] font-bold text-center transition-all cursor-pointer ${
                      bulkSimulationCount >= 301 && bulkSimulationCount <= 500
                        ? "bg-indigo-500/15 border-indigo-500/55 text-indigo-400 shadow shadow-indigo-500/10"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    301 - 500
                    <span className="block text-[8px] text-slate-500 font-light font-sans mt-0.5">Preset: 450 Streams</span>
                  </button>
                </div>
              </div>

              {/* Slider for precision cohort size Selection */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="font-mono text-slate-400">Precision Total Stream Sizing:</span>
                  <span className="text-indigo-400 font-mono font-bold text-xs bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded">
                    {bulkSimulationCount} Candidates
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={bulkSimulationCount}
                  onChange={(e) => setBulkSimulationCount(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-600">
                  <span>Min: 5</span>
                  <span>Max: 500 Candidates Limit</span>
                </div>
              </div>

              {/* INTERACTIVE EXCEL FILE ATTACHMENT & CANDIDATE INVITATION CAMPAIGN */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    Excel Candidate Import Engine & Dispatcher
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-snug">
                  Attach or drag an Excel/CSV spreadsheet. The system will scan columns, calculate total stream sizing, and enable automated secure invitation dispatch.
                </p>

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setExcelDragged(true);
                  }}
                  onDragLeave={() => setExcelDragged(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setExcelDragged(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleParseExcel(file);
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".xlsx, .xls, .csv";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleParseExcel(file);
                    };
                    input.click();
                  }}
                  className={`border border-dashed p-5 rounded-lg text-center cursor-pointer transition-all duration-200 ${
                    excelDragged
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-slate-800 hover:border-slate-750 bg-slate-900/50"
                  }`}
                >
                  {isAnalyzingExcel ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-[11px] font-mono text-slate-400">Analyzing row sheets & matching headers...</span>
                    </div>
                  ) : excelFile ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {excelFile.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        File Size: {(excelFile.size / 1024).toFixed(1)} KB &bull; Row count: {excelCandidates.length} Candidates
                      </p>
                      <p className="text-[9px] bg-indigo-500/10 text-indigo-400 inline-block px-2 py-0.5 rounded border border-indigo-500/20">
                        🔄 Slide total stream sizing updated to {bulkSimulationCount}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <Upload className="w-5 h-5 text-slate-550 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-300">Click to upload or drag Excel / CSV here</p>
                      <p className="text-[10px] font-mono text-slate-500">Standard spreadsheet templates supported (.xlsx, .csv)</p>
                    </div>
                  )}
                </div>

                {excelError && (
                  <p className="text-[10px] font-mono text-rose-450 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    ⚠️ {excelError}
                  </p>
                )}

                {/* Detected Column Configuration */}
                {excelCandidates.length > 0 && (
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400">Matching Configuration:</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                        ✓ Auto-matched Columns
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[9px] uppercase">Candidate Email Column</label>
                        <select
                          value={excelEmailCol}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExcelEmailCol(val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                        >
                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-slate-500 font-mono text-[9px] uppercase">Candidate Name Column</label>
                        <select
                          value={excelNameCol}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExcelNameCol(val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                        >
                          {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Live Rich Candidate Status Table */}
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        Matched Candidate Roster ({excelCandidates.length})
                      </span>
                      <div className="max-h-48 overflow-y-auto border border-slate-850 rounded bg-slate-950 p-1.5 divide-y divide-slate-900/50 space-y-1">
                        {excelCandidates.map((c, idx) => {
                          const indivLink = `${window.location.origin}/invite/sim-candidate-${idx + 1}`;
                          const isCopied = copiedInviteId === `indiv-${idx}`;
                          return (
                            <div key={idx} className="p-2 flex items-center justify-between gap-2 hover:bg-slate-900/40 rounded transition-colors text-[10px]">
                              <div className="truncate space-y-0.5 text-left">
                                <p className="font-bold text-slate-200 truncate">{c.name}</p>
                                <p className="text-slate-500 font-mono truncate text-[9px]">{c.email}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                                  invitationStatus === "done" || idx < successCount
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-amber-500/10 text-amber-500 animate-pulse"
                                }`}>
                                  {invitationStatus === "done" || idx < successCount ? "SENT" : "PENDING"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(indivLink);
                                    setCopiedInviteId(`indiv-${idx}`);
                                    setTimeout(() => setCopiedInviteId(null), 2000);
                                  }}
                                  className="h-6 w-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Copy individual secure login link"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Link className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Automatic Action Trigger */}
                    <div className="border-t border-slate-800 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">Invite Delivery Campaign</span>
                        {invitationStatus === "sending" && (
                          <span className="text-[9.5px] text-indigo-400 font-mono animate-pulse font-bold">
                            Dispatched: {successCount}/{excelCandidates.length}
                          </span>
                        )}
                      </div>

                      {invitationStatus === "idle" && (
                        <button
                          type="button"
                          onClick={handleDispatchInvitations}
                          className="w-full h-8 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs tracking-tight rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Invitation Emails to Candidates Now
                        </button>
                      )}

                      {/* Display Sending Status Bar */}
                      {invitationStatus !== "idle" && (
                        <div className="space-y-2.5">
                          {/* Progress Line */}
                          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${(successCount / excelCandidates.length) * 105}%` }}
                            />
                          </div>

                          {/* Live Console Terminal Output */}
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-md text-[9px] font-mono text-indigo-300 h-28 overflow-y-auto space-y-1.5">
                            {sendingLogs.map((log, i) => (
                              <div key={i} className="leading-relaxed">
                                {log.startsWith("✔") || log.includes("✔") ? (
                                  <span className="text-emerald-400">{log}</span>
                                ) : log.includes("⚠️") ? (
                                  <span className="text-rose-400">{log}</span>
                                ) : (
                                  <span>{log}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-User Shared Invite URL generator for Bulk Cohort */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Link className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    Multi-User Shareable Invite URL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-snug">
                  Provide this unique, resilient link to actual cohort candidates. Upon entry, they will log in securely with Gmail, configure their device hardware room, and feed directly into your real-time tracking display.
                </p>
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    readOnly
                    id="txt_bulk_modal_invite_link"
                    value={`${window.location.origin}/invite/bulk-sim-session`}
                    className="flex-1 bg-transparent px-2.5 text-xs font-mono text-emerald-400 focus:outline-none truncate select-all"
                  />
                  <button
                    type="button"
                    id="btn_copy_bulk_modal_invite_link"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/bulk-sim-session`);
                      setBulkInviteCopied(true);
                      setTimeout(() => setBulkInviteCopied(false), 2000);
                    }}
                    className={`h-8 px-3 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      bulkInviteCopied 
                        ? "bg-emerald-500 text-slate-950 font-black" 
                        : "bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {bulkInviteCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

               {/* Action Trigger Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn_cancel_bulk_modal"
                  type="button"
                  onClick={() => setShowBulkSetupModal(false)}
                  className="px-4 h-9 rounded-lg hover:bg-slate-800 text-slate-400 text-xs font-semibold tracking-tight transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn_confirm_deploy_bulk"
                  type="button"
                  onClick={() => {
                    localStorage.setItem("ai_mock_interview_bulk_active", "true");
                    setIsBulkSimulationActive(true);
                    setShowBulkSetupModal(false);
                    setShowLiveMonitorPanel(true);
                  }}
                  className="px-5 h-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold tracking-tight transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/15"
                >
                  <Users className="w-3.5 h-3.5 text-slate-950" />
                  Deploy Cohort Now ({bulkSimulationCount} Cand.)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
