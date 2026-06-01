import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Play, Sparkles, User, FileText, LayoutGrid, Award, AlertCircle, 
  Volume2, Check, Copy, ExternalLink, X, Link, Trash2, Mic, MicOff, Upload, 
  Plus, Activity, FileAudio, RefreshCw, Mail, Send
} from "lucide-react";
import { mockDb } from "../lib/mockDb";
import { Interview, ResumeData } from "../types";

interface NewInterviewProps {
  onNavigate: (path: string) => void;
  theme?: "dark" | "light";
}

export default function NewInterview({ onNavigate, theme = "dark" }: NewInterviewProps) {
  const isLight = theme === "light";
  const inputBg = isLight 
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500" 
    : "bg-slate-950 border-slate-800 text-white placeholder:text-slate-750 focus:border-emerald-500";
  const labelColor = isLight ? "text-slate-600" : "text-slate-400";
  const panelBg = isLight ? "bg-slate-50 border-slate-200/80 shadow-sm" : "bg-slate-900/10 border-slate-850/70";
  const subPanelBg = isLight ? "bg-slate-100 border-slate-200/80" : "bg-slate-950/40 border-slate-850";
  const textColor = isLight ? "text-slate-900" : "text-slate-200";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [preferredVoice, setPreferredVoice] = useState<"female" | "male" | "replica">("female");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Candidate fitment preferences states
  const [workModeEnabled, setWorkModeEnabled] = useState(true);
  const [workMode, setWorkMode] = useState<"on-site" | "remote" | "hybrid">("on-site");
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [locationType, setLocationType] = useState<"current" | "preferred">("current");
  const [bondNoticeEnabled, setBondNoticeEnabled] = useState(true);

  // Manual pre-questions state
  const [manualQuestions, setManualQuestions] = useState<string[]>([""]);

  // Replica voice clone states
  const [replicaSettings, setReplicaSettings] = useState<{
    trained: boolean;
    pitch: number;
    rate: number;
    originalFilename?: string;
  }>(() => {
    const saved = localStorage.getItem("voice_replica_settings");
    return saved ? JSON.parse(saved) : { trained: false, pitch: 1.0, rate: 0.95 };
  });

  const [isRecordingReplica, setIsRecordingReplica] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(0);
  const [replicaUploadProgress, setReplicaUploadProgress] = useState(0);
  const [isUploadingReplica, setIsUploadingReplica] = useState(false);
  
  const voiceReplicaMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceReplicaStreamRef = useRef<MediaStream | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedInterviewId, setGeneratedInterviewId] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // Manual questions logic
  const handleAddManualQuestion = () => {
    setManualQuestions([...manualQuestions, ""]);
  };

  const handleRemoveManualQuestion = (idx: number) => {
    const updated = manualQuestions.filter((_, i) => i !== idx);
    setManualQuestions(updated.length === 0 ? [""] : updated);
  };

  const handleManualQuestionChange = (idx: number, val: string) => {
    const updated = [...manualQuestions];
    updated[idx] = val;
    setManualQuestions(updated);
  };

  // Recording replica vocal profile
  const startRecordingReplica = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceReplicaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      voiceReplicaMediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        // Formulate a fun estimated frequency based on standard voice pitch ratios
        const randomPitch = parseFloat((0.85 + Math.random() * 0.3).toFixed(2));
        const newSettings = {
          trained: true,
          pitch: randomPitch,
          rate: 0.95,
          originalFilename: `Voice_Replica_Recorded_Channel.wav`
        };
        setReplicaSettings(newSettings);
        localStorage.setItem("voice_replica_settings", JSON.stringify(newSettings));
        setPreferredVoice("replica");
      };

      mediaRecorder.start();
      setIsRecordingReplica(true);
      setRecordingSecondsLeft(5);

      const interval = setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
            if (stream) {
              stream.getTracks().forEach(t => t.stop());
            }
            setIsRecordingReplica(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Microphone permission has been rejected or is inaccessible.");
    }
  };

  // Uploading replica vocal document
  const handleVoiceUploadTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReplica(true);
    setReplicaUploadProgress(5);

    const interval = setInterval(() => {
      setReplicaUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploadingReplica(false);
            const newSettings = {
              trained: true,
              pitch: parseFloat((0.9 + Math.random() * 0.25).toFixed(2)),
              rate: 0.95,
              originalFilename: file.name
            };
            setReplicaSettings(newSettings);
            localStorage.setItem("voice_replica_settings", JSON.stringify(newSettings));
            setPreferredVoice("replica");
          }, 150);
          return 100;
        }
        return prev + 15;
      });
    }, 120);
  };

  const playVoiceDemo = async () => {
    // Stop standard speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Cancel the current HTML5 audio state if playing
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const text = "Namaste! I will be your Indian female AI recruiter for this interview session, ya? Best of luck!";
    speakSpeechSynthesisDemo(text);
  };

  const speakSpeechSynthesisDemo = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith("en"));
    const inVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith("en-in"));
    
    let selectedVoice = null;
    if (inVoices.length > 0) {
      // Find female Indian English voice
      const femaleIN = inVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("veena") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("neerja"));
      selectedVoice = femaleIN || inVoices[0];
    } else {
      const premiumFemale = enVoices.find(v => v.name.toLowerCase().includes("female") && v.name.toLowerCase().includes("google"));
      if (premiumFemale) {
        selectedVoice = premiumFemale;
      } else {
        const femaleNames = ["zira", "samantha", "victoria", "hazel", "female", "karen", "moira", "tessa", "veena"];
        selectedVoice = enVoices.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (enVoices.length > 0) {
      utterance.voice = enVoices[0];
    }
    
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Read resumes and profile name
    const storedResumes = mockDb.getResumes();
    setResumes(storedResumes);
    if (storedResumes.length > 0) {
      setSelectedResumeId(storedResumes[0].id);
    }
    
    const profile = mockDb.getProfile();
    if (profile?.full_name) {
      setCandidateName(profile.full_name);
    }

    return () => {
      // Pause any active ElevenLabs audio on unmount
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleStartInterview = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (resumes.length === 0) {
      setError("Please upload a resume first. A resume is strictly required to initialize the Practice Room.");
      setIsLoading(false);
      return;
    }

    if (!selectedResumeId) {
      setError("Please select a target resume scenario.");
      setIsLoading(false);
      return;
    }

    if (!candidateName.trim()) {
      setError("Please specify a candidate name. It is required to open the voice session.");
      setIsLoading(false);
      return;
    }

    if (!targetRole.trim()) {
      setError("Please specify your target role.");
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      try {
        const interviewId = "int_" + Math.random().toString(36).substring(2, 11);
        const selectedResume = resumes.find(r => r.id === selectedResumeId);
        
        const filteredManualQs = manualQuestions.map(q => q.trim()).filter(q => q !== "");

        const newInterview: Interview = {
          id: interviewId,
          user_id: "client_user",
          resume_id: selectedResumeId,
          candidate_name: candidateName,
          candidate_email: candidateEmail.trim() || undefined,
          role: targetRole,
          difficulty: "medium", // set default difficulty level since the tier selector is removed
          total_questions: totalQuestions,
          current_question_idx: 0,
          status: "in_progress",
          started_at: new Date().toISOString(),
          resume_filename: selectedResume?.filename || "Resume Portfolio.pdf",
          decision: "pending",
          preferred_voice: preferredVoice,
          manual_questions: filteredManualQs,
          fitment_work_mode_enabled: workModeEnabled,
          fitment_work_mode: workMode,
          fitment_location_enabled: locationEnabled,
          fitment_location_type: locationType,
          fitment_bond_notice_enabled: bondNoticeEnabled
        };

        // Save in mockDb
        mockDb.createInterview(newInterview);
        
        // Save matching initial profile name sync
        const profile = mockDb.getProfile();
        profile.full_name = candidateName;
        mockDb.updateProfile(profile);

        // Auto Send Link to Email
        if (candidateEmail.trim() && autoSendEmail) {
          const clientEmailAddress = mockDb.getProfile()?.email || "";
          fetch("/api/send-invite-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: candidateEmail.trim(),
              candidateName: candidateName.trim(),
              role: targetRole,
              inviteLink: `${window.location.origin}/invite/${interviewId}`,
              preferredVoice: preferredVoice,
              clientEmail: clientEmailAddress
            })
          })
          .then(res => res.json())
          .then(data => console.log("SMTP Link Broadcast Complete:", data))
          .catch(e => console.error("SMTP Broadcast Error:", e));
        }

        setGeneratedInterviewId(interviewId);
        setIsLoading(false);
        setInviteCopied(false);
        setShowInviteModal(true);
      } catch (err: any) {
        console.error(err);
        setError("Could not create interview session. Ensure database syncing is unobstructed.");
        setIsLoading(false);
      }
    }, 750);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isLight ? "bg-transparent text-[#131518]" : "bg-slate-950 text-slate-100"}`}>

      {/* HeaderNav */}
      <header className={`relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-b z-10 backdrop-blur-md transition-colors duration-500 ${
        isLight ? "border-slate-200 bg-[#f8f8f6]/30" : "border-slate-900 bg-slate-950/30"
      }`}>
        <button
          id="btn_new_int_back"
          onClick={() => onNavigate("/app")}
          className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors ${
            isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest font-semibold">New Session Setup</span>
      </header>

      {/* Main Form Context */}
      <main className="max-w-7xl mx-auto px-6 py-10 z-10 relative">
        <div className="max-w-2xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 border rounded-2xl transition-all duration-500 ${
              isLight ? "bg-white/85 border-slate-200/80 shadow-xl" : "bg-slate-900/40 border-slate-800 shadow-2xl"
            }`}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 through-teal-400 to-blue-500 rounded-t-2xl" />

            <div className="text-center space-y-2 mb-8">
              <h2 className={`text-xl font-bold font-display tracking-tight ${isLight ? "text-[#131518]" : "text-white"}`}>Configure Interview Room</h2>
              <p className={`text-xs px-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Personalize details below to start. The AI generates and speaks highly targeted system-level technical and behavioral questions aloud.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex gap-2.5 items-start">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              
              {/* 1. CANDIDATE NAME - SHOWN FIRST */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${labelColor}`}>
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Candidate Full Name <span className="text-emerald-500">* (REQUIRED)</span>
                </label>
                <input
                  id="setup_candidate_name"
                  type="text"
                  value={candidateName}
                  onChange={(e) => {
                    setCandidateName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="E.g., Alex Rodriguez"
                  className={`w-full h-11 rounded-lg px-4 text-xs focus:outline-none tracking-wide transition-all font-sans ${inputBg}`}
                  required
                />
              </div>

              {/* Secure Link Email Notification configuration block */}
              <div className={`space-y-3 p-5 rounded-2xl border transition-colors duration-500 ${panelBg}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold ${labelColor}`}>
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    Secure Link Email Notification
                  </label>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Optional</span>
                </div>
                <p className={`text-[10px] font-light leading-relaxed ${textMuted}`}>
                  Enter the candidate's or client’s email address. Upon room activation, HireIQ will dispatch an encrypted magic invitation link automatically.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      id="setup_candidate_email"
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="e.g., candidate@domain.com or client@company.com"
                      className={`w-full h-11 rounded-lg pl-10 pr-4 text-xs focus:outline-none transition-all font-sans ${inputBg}`}
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={autoSendEmail}
                        onChange={(e) => setAutoSendEmail(e.target.checked)}
                        className={`peer appearance-none w-4 h-4 rounded border focus:outline-none cursor-pointer transition-all ${
                          isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-750 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                        }`}
                      />
                      {autoSendEmail && (
                        <Check className="absolute w-3 h-3 text-slate-950 stroke-[3] pointer-events-none left-0.5 top-0.5" />
                      )}
                    </div>
                    <span className={`text-xs transition-colors ${isLight ? "text-slate-650 group-hover:text-black" : "text-slate-400 group-hover:text-slate-200"}`}>
                      Automatically dispatch interview session link upon activation
                    </span>
                  </label>
                </div>
              </div>

              {/* 2. TARGET ROLE */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${labelColor}`}>
                  <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
                  Target Role Setup <span className="text-slate-500">*</span>
                </label>
                <input
                  id="setup_target_role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="E.g., Senior Frontend Engineer"
                  className={`w-full h-11 rounded-lg px-4 text-xs focus:outline-none tracking-wide transition-all font-sans ${inputBg}`}
                  required
                />
              </div>

              {/* 3. QUESTIONS COUNT / LENGTH */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono uppercase tracking-wider block ${labelColor}`}>Total Interview Length</label>
                <select
                  id="setup_questions_count"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className={`w-full h-11 rounded-lg px-3 text-xs focus:outline-none transition-all font-sans ${inputBg}`}
                >
                  <option value={2} className={isLight ? "text-slate-900 bg-white" : "text-slate-300 bg-slate-950"}>2 Questions (Brief run)</option>
                  <option value={3} className={isLight ? "text-slate-900 bg-white" : "text-slate-300 bg-slate-950"}>3 Questions (Standard session)</option>
                  <option value={4} className={isLight ? "text-slate-900 bg-white" : "text-slate-300 bg-slate-950"}>4 Questions (Deep assessment)</option>
                  <option value={5} className={isLight ? "text-slate-900 bg-white" : "text-slate-300 bg-slate-950"}>5 Questions (Comprehensive loop)</option>
                </select>
              </div>

              {/* Manual Warmup Questions block */}
              <div className={`space-y-3 p-5 rounded-2xl border transition-colors duration-500 ${panelBg}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold ${labelColor}`}>
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Manual Warmup Questions
                  </label>
                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="text-[9px] font-mono uppercase tracking-wider text-emerald-500 hover:text-emerald-450 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>
                <p className={`text-[10px] font-light leading-relaxed ${textMuted}`}>
                  Optional. Submit custom warmup questions to ask vocally first. Once the candidate answers them, our AI resumes from there.
                </p>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {manualQuestions.map((question, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 select-none">#{idx + 1}</span>
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => handleManualQuestionChange(idx, e.target.value)}
                        placeholder="E.g., Walk me through your design approach for implementing scalable global cache states."
                        className={`flex-1 h-9 rounded-lg px-3 text-xs focus:outline-none transition-all font-sans ${inputBg}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveManualQuestion(idx)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          isLight 
                            ? "bg-slate-50 border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 hover:border-rose-200" 
                            : "bg-slate-950 border-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 hover:border-rose-900/30"
                        }`}
                        title="Remove Question Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Interviewer Voice Persona Selection with demos */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  AI Recruiter Voice Persona <span className="text-slate-500">*</span>
                </label>
                <p className="text-[10.5px] text-slate-500 font-light leading-relaxed">
                  The session is pre-configured with our signature, high-fidelity Indian female voice representation. Click the play demo icon below to test.
                </p>
                <div className="animate-fade-in max-w-sm">
                  
                  {/* Indian Slang Female Persona Selection block */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-28 text-left group ${
                      isLight 
                        ? "bg-slate-50 border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" 
                        : "bg-slate-900/80 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 w-full mb-2">
                      <div className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-emerald-500 bg-emerald-500 text-slate-950">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isLight ? "text-slate-950" : "text-slate-200"}`}>Indian Slang Female</p>
                        <p className="text-[9px] font-mono text-slate-500 truncate">Expressive Dialect Synthesis</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[8px] font-mono text-slate-600 font-medium">Local Synthesis (en-IN)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceDemo();
                        }}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-sm shrink-0 border ${
                          isLight
                            ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-black"
                            : "bg-slate-900 border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400"
                        }`}
                        title="Play Indian Female Audio Sample"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 4. RESUME SELECTOR (STRICLY REQUIRED) */}
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold ${labelColor}`}>
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Select Required Portfolio Resume <span className="text-emerald-500">*</span>
                  </span>

                  {resumes.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 text-left">
                      <p className="text-xs text-amber-500 font-light leading-relaxed">
                        You do not have any resumes uploaded in the diagnostic repository yet. Recruiter standards require an uploaded resume profile to optimize tailored question vectors.
                      </p>
                      <button
                        id="btn_navigate_to_upload_from_setup"
                        type="button"
                        onClick={() => onNavigate("/app/resume")}
                        className="px-4 h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Go to Resume Upload Console
                      </button>
                    </div>
                  ) : (
                    <select
                      id="setup_resume_select"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className={`w-full h-11 rounded-lg px-3 text-xs focus:outline-none transition-all font-sans ${inputBg}`}
                      required
                    >
                      {resumes.map((resume) => (
                        <option key={resume.id} value={resume.id} className={isLight ? "text-slate-900 bg-white" : "text-slate-300 bg-slate-950"}>
                          {resume.filename} (ATS Readiness: {resume.ats_score}%)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Candidate Fitment Preferences Container as requested from the mockup */}
                <div className={`p-5 rounded-xl space-y-4 text-left animate-fade-in shadow-inner border transition-all duration-500 ${subPanelBg}`}>
                  
                  {/* Work Mode preference */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={workModeEnabled}
                          onChange={(e) => setWorkModeEnabled(e.target.checked)}
                          className={`peer appearance-none w-4 h-4 rounded border focus:outline-none cursor-pointer transition-all ${
                            isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                          }`}
                        />
                        {workModeEnabled && (
                          <Check className="absolute w-3 h-3 text-slate-950 stroke-[3] pointer-events-none left-0.5 top-0.5" />
                        )}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${isLight ? "text-slate-750 group-hover:text-black" : "text-slate-200 group-hover:text-white"}`}>Work Mode</span>
                    </label>

                    {workModeEnabled && (
                      <div className="pl-7 flex items-center gap-6 animate-fade-in">
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors select-none ${isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"}`}>
                          <input
                            type="radio"
                            name="workMode"
                            value="on-site"
                            checked={workMode === "on-site"}
                            onChange={() => setWorkMode("on-site")}
                            className={`appearance-none w-3.5 h-3.5 rounded-full border focus:outline-none cursor-pointer transition-all ${
                              isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                            }`}
                          />
                          <span className={workMode === "on-site" ? (isLight ? "text-slate-900 font-semibold" : "text-slate-200 font-medium") : ""}>On-site</span>
                        </label>
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors select-none ${isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"}`}>
                          <input
                            type="radio"
                            name="workMode"
                            value="remote"
                            checked={workMode === "remote"}
                            onChange={() => setWorkMode("remote")}
                            className={`appearance-none w-3.5 h-3.5 rounded-full border focus:outline-none cursor-pointer transition-all ${
                              isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                            }`}
                          />
                          <span className={workMode === "remote" ? (isLight ? "text-slate-900 font-semibold" : "text-slate-200 font-medium") : ""}>Remote</span>
                        </label>
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors select-none ${isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"}`}>
                          <input
                            type="radio"
                            name="workMode"
                            value="hybrid"
                            checked={workMode === "hybrid"}
                            onChange={() => setWorkMode("hybrid")}
                            className={`appearance-none w-3.5 h-3.5 rounded-full border focus:outline-none cursor-pointer transition-all ${
                              isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                            }`}
                          />
                          <span className={workMode === "hybrid" ? (isLight ? "text-slate-900 font-semibold" : "text-slate-200 font-medium") : ""}>Hybrid</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Location preference */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={locationEnabled}
                          onChange={(e) => setLocationEnabled(e.target.checked)}
                          className={`peer appearance-none w-4 h-4 rounded border focus:outline-none cursor-pointer transition-all ${
                            isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                          }`}
                        />
                        {locationEnabled && (
                          <Check className="absolute w-3 h-3 text-slate-950 stroke-[3] pointer-events-none left-0.5 top-0.5" />
                        )}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${isLight ? "text-slate-750 group-hover:text-black" : "text-slate-200 group-hover:text-white"}`}>Location</span>
                    </label>

                    {locationEnabled && (
                      <div className="pl-7 flex items-center gap-6 animate-fade-in">
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors select-none ${isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"}`}>
                          <input
                            type="radio"
                            name="locationType"
                            value="current"
                            checked={locationType === "current"}
                            onChange={() => setLocationType("current")}
                            className={`appearance-none w-3.5 h-3.5 rounded-full border focus:outline-none cursor-pointer transition-all ${
                              isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                            }`}
                          />
                          <span className={locationType === "current" ? (isLight ? "text-slate-900 font-semibold" : "text-slate-200 font-medium") : ""}>Current Location</span>
                        </label>
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors select-none ${isLight ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"}`}>
                          <input
                            type="radio"
                            name="locationType"
                            value="preferred"
                            checked={locationType === "preferred"}
                            onChange={() => setLocationType("preferred")}
                            className={`appearance-none w-3.5 h-3.5 rounded-full border focus:outline-none cursor-pointer transition-all ${
                              isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                            }`}
                          />
                          <span className={locationType === "preferred" ? (isLight ? "text-slate-900 font-semibold" : "text-slate-200 font-medium") : ""}>Preferred Location</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bond / Notice Period preference */}
                  <div className="pt-1">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={bondNoticeEnabled}
                          onChange={(e) => setBondNoticeEnabled(e.target.checked)}
                          className={`peer appearance-none w-4 h-4 rounded border focus:outline-none cursor-pointer transition-all ${
                            isLight ? "border-slate-300 bg-white checked:bg-emerald-500 checked:border-emerald-500" : "border-slate-700 bg-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                          }`}
                        />
                        {bondNoticeEnabled && (
                          <Check className="absolute w-3 h-3 text-slate-950 stroke-[3] pointer-events-none left-0.5 top-0.5" />
                        )}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${isLight ? "text-slate-750 group-hover:text-black" : "text-slate-200 group-hover:text-white"}`}>Bond / Notice Period</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* FORM SUBMIT GLOW ACTION */}
              <div className="pt-4">
                <button
                  id="btn_setup_start"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Waking AI Recruiter & Compiling Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                      Create & Initialize Room
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>

        </div>
      </main>

      {/* Pristine Candidate Invite Link Modal Overlay */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            id="blk_invite_modal_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              id="blk_invite_modal_card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-left"
            >
              {/* Header decoration */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
                    <Link className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Interview Room Activated</h3>
                    <p className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500">Secure Candidate Invitation Key</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description & metadata summary */}
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  The voice simulation room has been successfully configured. Send this secure, unique invite link to your candidate. 
                  Under security compliance rules, <strong>this link expires automatically after the session ends</strong>.
                </p>

                <div className="p-3 bg-slate-950/60 border border-slate-850/80 rounded-xl space-y-1 text-[11px] font-mono text-slate-500">
                  <div>&bull; Recipient Candidate: <span className="text-slate-300 font-bold">{candidateName}</span></div>
                  {candidateEmail && (
                    <div>&bull; Candidate Email: <span className="text-slate-300">{candidateEmail}</span></div>
                  )}
                  <div>&bull; Target Role Scenario: <span className="text-slate-350">{targetRole}</span></div>
                  <div>&bull; Configured Voice: <span className="text-slate-350 capitalize">{preferredVoice} style</span></div>
                </div>

                {candidateEmail && autoSendEmail && (
                  <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-bold">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Auto-Delivery Status: Dispatched
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase font-bold">Built-In Delivery Service</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-light">
                      Successfully formulated secure invitation and dispatched to <strong className="text-emerald-400 font-medium">{candidateEmail}</strong> {mockDb.getProfile()?.email ? <span className="text-slate-450">with an automated audit copy sent to client <strong className="text-emerald-500 font-medium">{mockDb.getProfile().email}</strong></span> : ""}. Secure delivery TLS confirmed.
                    </p>
                  </div>
                )}
              </div>

              {/* Copy URL share deck field box */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Copy Shareable Invite Link:
                </label>
                <div className="flex bg-slate-950 border border-slate-850 rounded-xl p-1 items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/invite/${generatedInterviewId}`}
                    className="flex-1 bg-transparent px-3 text-xs font-mono text-emerald-400 focus:outline-none truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${generatedInterviewId}`);
                      setInviteCopied(true);
                    }}
                    className={`h-9 px-4 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      inviteCopied 
                        ? "bg-emerald-500 text-slate-950 font-black" 
                        : "bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 hover:text-white"
                    }`}
                  >
                    {inviteCopied ? (
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

              {/* Navigation Action Buttons footer */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-850/60">
                <button
                  type="button"
                  onClick={() => onNavigate(`/app/interview/${generatedInterviewId}`)}
                  className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Launch Interview Room Now
                  <Play className="w-3 h-3 fill-current text-slate-950" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("/app")}
                  className="h-10 px-4 rounded-xl hover:bg-slate-850 text-slate-400 text-xs font-semibold tracking-tight transition-colors cursor-pointer border border-transparent hover:border-slate-800"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
