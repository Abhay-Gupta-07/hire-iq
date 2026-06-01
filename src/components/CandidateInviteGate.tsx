import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  LayoutGrid, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Video, 
  Mic, 
  Volume2, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Check
} from "lucide-react";
import { mockDb } from "../lib/mockDb";
import { Interview } from "../types";

interface CandidateInviteGateProps {
  interviewId: string;
  onNavigate: (path: string) => void;
  theme?: "dark" | "light";
}

export default function CandidateInviteGate({ interviewId, onNavigate, theme = "dark" }: CandidateInviteGateProps) {
  const isLight = theme === "light";
  const wrapperClass = `min-h-screen font-sans flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
    isLight ? "bg-transparent text-[#131518]" : "bg-slate-950 text-slate-100"
  }`;
  const cardClass = `max-w-md w-full border relative transition-all duration-500 p-8 rounded-2xl ${
    isLight ? "bg-white/90 border-slate-200/80 shadow-lg text-slate-800" : "bg-slate-900/60 border-slate-850 shadow-2xl text-slate-100"
  }`;
  const inputBg = isLight 
    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500" 
    : "bg-slate-950 border-slate-800 text-white placeholder:text-slate-700 focus:border-indigo-505";
  const labelColor = isLight ? "text-slate-600 font-medium" : "text-slate-400";
  const panelBg = isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/80 border-slate-850/80";

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isBulkSim, setIsBulkSim] = useState(false);
  const [bulkActive, setBulkActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [bulkCandidateName, setBulkCandidateName] = useState("");
  const [bulkCandidateRole, setBulkCandidateRole] = useState("");

  // Step state: "auth" | "gate" | "config"
  const [step, setStep] = useState<"auth" | "gate" | "config">("auth");
  
  // Gmail Auth form values
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Calibration states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [camPermission, setCamPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [micPermission, setMicPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [playTestTone, setPlayTestTone] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Determine if it is a bulk simulated ID
    let rawBulkActive = localStorage.getItem("ai_mock_interview_bulk_active");
    if (rawBulkActive === null) {
      localStorage.setItem("ai_mock_interview_bulk_active", "true");
      rawBulkActive = "true";
    }
    const sampleBulkActive = rawBulkActive === "true";
    
    if (interviewId.startsWith("sim-candidate-") || interviewId.startsWith("bulk-")) {
      setIsBulkSim(true);
      setBulkActive(sampleBulkActive);
      
      if (!sampleBulkActive) {
        setExpired(true);
      } else {
        // Mock a representative name based on index
        const indexMatch = interviewId.match(/\d+/);
        const indexStr = indexMatch ? indexMatch[0] : "1";
        const index = parseInt(indexStr) || 1;
        
        const candidateNames = [
          "Alexander Mercer", "Sofia Sterling", "Liam Henderson", "Amara Vance", "Ethan Thorne",
          "Isabella Croft", "Marcus Vance", "Elena Rostova", "Devon Lane", "Priya Nair"
        ];
        const technicalRoles = [
          "Lead React Architect", "Data Solution Analyst", "Python Security Engineer", "Cloud SRE DevOps",
          "AI Inference Dev", "Product Experience Lead", "Full Stack Integrations Expert"
        ];
        
        let excelList: Array<{ name?: string; email?: string; role?: string }> = [];
        try {
          const saved = localStorage.getItem("excel_candidates_imported");
          if (saved) {
            excelList = JSON.parse(saved);
          }
        } catch (e) {
          console.error(e);
        }

        if (excelList.length > 0) {
          const item = excelList[(index - 1) % excelList.length];
          setBulkCandidateName(item.name || `Candidate #${index}`);
          setBulkCandidateRole(item.role || "Software Engineer");
        } else {
          setBulkCandidateName(candidateNames[index % candidateNames.length]);
          setBulkCandidateRole(technicalRoles[index % technicalRoles.length]);
        }
      }
      setLoading(false);
    } else {
      // Standard interview
      const item = mockDb.getInterviewById(interviewId);
      if (item) {
        setInterview(item);
        if (item.status === "completed") {
          setExpired(true);
        }
      } else {
        setExpired(false); // will trigger 'Not found' since interview is null
      }
      setLoading(false);
    }
  }, [interviewId]);

  // Handle stream calibration on entering config step
  useEffect(() => {
    if (step === "config") {
      startMediaStream();
    }
    return () => {
      stopMediaStream();
    };
  }, [step]);

  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCamPermission("granted");
      setMicPermission("granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize mic visualizer
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average audio level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setMicLevel(Math.min(100, Math.round(average * 1.5)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (audioErr) {
        console.warn("Audio analysis failed to context mount: ", audioErr);
      }
    } catch (err) {
      console.error("Camera setup failed: ", err);
      setCamPermission("denied");
      setMicPermission("denied");
    }
  };

  const stopMediaStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const triggerAudioToneHz = () => {
    if (playTestTone) return;
    setPlayTestTone(true);
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const volumeNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard middle A
      
      volumeNode.gain.setValueAtTime(0.04, ctx.currentTime);
      volumeNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(volumeNode);
      volumeNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
      
      setTimeout(() => {
        setPlayTestTone(false);
      }, 1400);
    } catch (e) {
      setPlayTestTone(false);
    }
  };

  // Auth Submit Handlers
  const handleGmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!gmailEmail.includes("@")) {
      setAuthError("Enter a valid Gmail account credential.");
      return;
    }

    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      // Secure auth simulated state
      localStorage.setItem("candidate_oauth_email", gmailEmail);
      localStorage.setItem("candidate_oauth_authed", "true");
      setStep("gate");
    }, 1100);
  };

  const handleAcceptInvite = () => {
    // Progress to calibrate test room
    setStep("config");
  };

  const handleLaunchInterview = () => {
    stopMediaStream();

    // Set appropriate secure bypasses for the route check
    localStorage.setItem("invite_bypass_" + interviewId, "true");
    
    const displayCandidateName = isBulkSim ? bulkCandidateName : (interview?.candidate_name || gmailEmail.split("@")[0]);
    const displayRole = isBulkSim ? bulkCandidateRole : (interview?.role || "Software Engineer");

    // Persist real candidate profile credentials
    localStorage.setItem(`candidate_proctor_name_${interviewId}`, displayCandidateName);
    localStorage.setItem(`candidate_proctor_email_${interviewId}`, gmailEmail || "abbaabhayyy@gmail.com");

    if (isBulkSim) {
      // Trigger representative database seed so they can practice
      const simulatedObj: Interview = {
        id: interviewId,
        user_id: "client_user",
        resume_id: "sample_frontend",
        candidate_name: displayCandidateName,
        role: displayRole,
        difficulty: "medium",
        total_questions: 3,
        current_question_idx: 0,
        status: "in_progress",
        started_at: new Date().toISOString(),
        resume_filename: "Bulk_Simulated_Scenario.pdf",
        decision: "pending"
      };
      mockDb.createInterview(simulatedObj);
    }

    // Direct route
    onNavigate(`/app/interview/${interviewId}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center p-6 transition-colors duration-500 ${isLight ? "bg-transparent text-[#131518]" : "bg-slate-950 text-slate-105"}`}>
        <Loader2 className="w-8 h-8 text-indigo-405 animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Resolving Recruiter Invite Crypt...</p>
      </div>
    );
  }

  // EXPIRED STATE VIEW
  if (expired) {
    return (
      <div className={wrapperClass}>
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClass}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-red-500/40 rounded-t-2xl" />

          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className={`text-lg font-bold font-display tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Interview Invite Expired</h2>
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-wider font-extrabold">Security Invalidation Triggered</p>
          </div>

          <p className={`text-xs leading-relaxed font-light text-center ${isLight ? "text-slate-650" : "text-slate-400"}`}>
            {isBulkSim 
              ? "This simulated bulk candidate cohort session has been terminated by the administrator. All proctoring surveillance channels are closed."
              : "This unique interview practice session has already been completed. Under proctoring integrity and security guidelines, invitation tokens automatically expire instantly after the session ends."}
          </p>

          <div className={`p-4 rounded-xl space-y-1.5 text-left font-mono text-[10.5px] border ${isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-950/60 border-slate-850/80 text-slate-550"}`}>
            <div>&bull; Session Status: <strong className="text-red-500">Completed / Inactive</strong></div>
            <div>&bull; Security State: <span className={isLight ? "text-slate-800" : "text-slate-350"}>Token Expired</span></div>
            <div>&bull; Room ID: <span className="text-emerald-500 font-bold">{interviewId}</span></div>
          </div>

          <button
            onClick={() => onNavigate("/")}
            className={`w-full h-10 rounded-xl text-xs font-bold transition-all border ${
              isLight ? "bg-[#131518] border-black text-white hover:bg-slate-800" : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            Back to Home Portal
          </button>
        </motion.div>
      </div>
    );
  }

  // INVALID STATE VIEW (NOT FOUND)
  if (!isBulkSim && !interview) {
    return (
      <div className={wrapperClass}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClass}
        >
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto ${isLight ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1 text-center">
            <h2 className={`text-lg font-bold font-display ${isLight ? "text-slate-900" : "text-white"}`}>Invitation Link Not Found</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Unregistered Ingress Code</p>
          </div>

          <p className={`text-xs leading-relaxed font-light text-center ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            The referenced interview verification key is invalid or has been wiped by administrative telemetry sweeps. Please confirm your URL pathing parameters with the organizer.
          </p>

          <button
            onClick={() => onNavigate("/")}
            className={`w-full h-10 rounded-xl text-xs font-bold transition-all border ${
              isLight ? "bg-[#131518] border-black text-white hover:bg-slate-800" : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
            }`}
          >
            Back to Main Portal
          </button>
        </motion.div>
      </div>
    );
  }

  const displayCandidateName = isBulkSim ? bulkCandidateName : (interview?.candidate_name || "Invited Candidate");
  const displayRole = isBulkSim ? bulkCandidateRole : (interview?.role || "Interactive Candidate");
  const displayQuestions = isBulkSim ? 3 : (interview?.total_questions || 3);

  // STEP 1: GMAIL OAUTH LOGIN
  if (step === "auth") {
    return (
      <div className={wrapperClass}>
        <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-red-500/5 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[30%] w-96 h-96 bg-blue-500/5 rounded-full blur-[110px] pointer-events-none" />

        <motion.div
          key="auth_step"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-md w-full p-8 rounded-2xl shadow-2xl space-y-6 relative border transition-all duration-500 ${
            isLight ? "bg-white border-slate-200 text-slate-905" : "bg-slate-900 border-slate-800 text-slate-100"
          }`}
        >
          {/* Authentic Google Multi-color bar top banner decoration */}
          <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-red-500 via-amber-400 to-blue-500 rounded-t-2xl" />

          {/* Google Icon header branding */}
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center gap-1">
              <span className="text-xl font-extrabold font-display tracking-tight text-blue-600">G</span>
              <span className="text-xl font-extrabold font-display tracking-tight text-red-500">o</span>
              <span className="text-xl font-extrabold font-display tracking-tight text-amber-500">o</span>
              <span className="text-xl font-extrabold font-display tracking-tight text-blue-500">g</span>
              <span className="text-xl font-extrabold font-display tracking-tight text-green-500">l</span>
              <span className="text-xl font-extrabold font-display tracking-tight text-red-500">e</span>
            </div>
            <div>
              <h2 className={`text-lg font-bold font-display ${isLight ? "text-[#131518]" : "text-white"}`}>Sign in with Gmail</h2>
              <p className={`text-[11px] font-light ${isLight ? "text-black" : "text-slate-400"}`}>Use your Google Workspace credentials to calibrate security</p>
            </div>
          </div>

          <form onSubmit={handleGmailLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-55/10 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-[10px] font-mono uppercase font-black block ${labelColor}`}>Email or Phone</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={gmailEmail}
                  onChange={(e) => setGmailEmail(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all ${inputBg}`}
                />
                <Mail className="absolute right-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={() => setGmailEmail("abbaabhayyy@gmail.com")}
                className="text-[10.5px] text-blue-600 hover:text-blue-700 font-medium tracking-tight bg-blue-55/10 px-2 py-0.5 mt-1 rounded inline-block"
              >
                Use abbaabhayyy@gmail.com (Default)
              </button>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-mono uppercase font-black block ${labelColor}`}>Enter your Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={gmailPassword}
                  onChange={(e) => setGmailPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all ${inputBg}`}
                />
                <Lock className="absolute right-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className={`flex items-center gap-1.5 cursor-pointer select-none ${isLight ? "text-black" : "text-slate-300"}`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Keep me authorized
              </label>
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Verifying Cryptographic Credentials...
                </>
              ) : (
                <>
                  Sign In & Authorize Token
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className={`border-t pt-3 text-center text-[10px] leading-normal ${isLight ? "border-slate-100 text-black" : "border-slate-800 text-slate-400"}`}>
            By logging in you authorize the proctoring hub to run biometric verification processes to validate facial consistency.
          </div>
        </motion.div>
      </div>
    );
  }

  // STEP 2: VERIFIED INVITATION OVERVIEW GATEWAY
  if (step === "gate") {
    return (
      <div className={wrapperClass}>
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-505/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        <motion.div
          key="gate_step"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClass}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 rounded-t-2xl" />

          {/* Secure Profile Card Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-indigo-500 uppercase tracking-widest block font-extrabold">Identity Authenticated</span>
              <h3 className={`text-xs font-mono ${isLight ? "text-black font-semibold" : "text-slate-350"}`}>{gmailEmail || "Google User"}</h3>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className={`text-xl font-bold font-display tracking-tight ${isLight ? "text-black" : "text-white"}`}>Profile Locked, {displayCandidateName}</h2>
            <p className={`text-xs font-light leading-relaxed ${isLight ? "text-black" : "text-slate-400"}`}>
              Your Google authentication completed successfully. You are invited to complete the live training simulation setup.
            </p>
          </div>

          {/* Interview Details Card */}
          <div className={`p-4 border rounded-xl space-y-3 font-sans text-xs ${panelBg}`}>
            <div className={`flex items-center gap-2.5 ${isLight ? "text-black" : "text-slate-300"}`}>
              <User className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Candidate PROFILE</span>
                <strong className={isLight ? "text-black font-semibold" : "text-white font-medium"}>{displayCandidateName}</strong>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 ${isLight ? "text-black" : "text-slate-300"}`}>
              <LayoutGrid className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Target Scenario Role</span>
                <strong className={isLight ? "text-black font-semibold" : "text-white font-medium"}>{displayRole}</strong>
              </div>
            </div>

            <div className={`flex items-center gap-2.5 ${isLight ? "text-black" : "text-slate-300"}`}>
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-500 block uppercase">Standards Structure</span>
                <strong className={isLight ? "text-black font-semibold" : "text-white font-medium"}>{displayQuestions} Custom Questions</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleAcceptInvite}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            Accept & Unlatch Camera Calibration
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // STEP 3: PHYSICAL HARDWARE CALIBRATION & ROOM TEST
  return (
    <div className={wrapperClass}>
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        key="config_step"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={cardClass}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-505 rounded-t-2xl" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Video className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest block font-extrabold">Device Room Diagnostics</span>
            <h3 className={`text-sm font-bold leading-none ${isLight ? "text-slate-900" : "text-white"}`}>Configure & Verify Assets</h3>
          </div>
        </div>

        {/* Dynamic Webcam Preview Node */}
        <div className={`relative aspect-video rounded-xl overflow-hidden flex flex-col items-center justify-center border transition-all ${
          isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
        }`}>
          {camPermission === "granted" && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
          ) : camPermission === "denied" ? (
            <div className="p-4 text-center space-y-2 z-10">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-[11px] font-mono text-amber-500 uppercase font-black">Hardware Stream Blocked</p>
              <p className={`text-[10px] leading-normal max-w-[280px] ${isLight ? "text-slate-650" : "text-slate-400"}`}>
                Webcam and microphone features disabled. Authorize permissions inside your Chrome URL address bar.
              </p>
            </div>
          ) : (
            <div className="text-center p-3 text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
              <p className="text-[9.5px] font-mono uppercase tracking-wider">Unresolved Calibration Stream...</p>
            </div>
          )}

          <div className={`absolute bottom-2 left-2 pb-0.5 px-2 rounded text-[9px] font-mono pointer-events-none uppercase border ${
            isLight ? "bg-white/95 border-slate-200 text-slate-700 font-semibold" : "bg-slate-900/90 border-slate-800 text-slate-400"
          }`}>
            {displayCandidateName} Preview
          </div>
        </div>

        {/* Real-time responsive Microphone volume meter */}
        <div className={`space-y-1.5 p-3.5 border rounded-xl transition-all ${panelBg}`}>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className={`flex items-center gap-1 ${isLight ? "text-slate-700" : "text-slate-400"}`}>
              <Mic className="w-3.5 h-3.5 text-indigo-500" />
              Microphone Sensitivity
            </span>
            <span className={micLevel > 0 ? "text-emerald-500 font-bold" : "text-slate-400"}>
              {micLevel > 0 ? `${micLevel}% Active` : "Silence Detected"}
            </span>
          </div>

          <div className={`h-2 rounded-full overflow-hidden flex gap-0.5 ${isLight ? "bg-slate-200/90" : "bg-slate-900"}`}>
            <div 
              style={{ width: `${micLevel}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                micLevel > 60 
                  ? "bg-gradient-to-r from-emerald-500 to-amber-500" 
                  : "bg-indigo-500"
              }`}
            />
          </div>
          <p className="text-[9.5px] text-slate-500 font-light leading-none">
            Speak into your microphone to calibrate input wave metrics.
          </p>
        </div>

        {/* Speaker outputs verification trigger */}
        <div className={`flex items-center justify-between gap-3 p-3.5 border rounded-xl transition-all ${panelBg}`}>
          <div className="space-y-1">
            <h4 className={`text-[11px] font-bold flex items-center gap-1 ${isLight ? "text-slate-850" : "text-slate-200"}`}>
              <Volume2 className="w-3.5 h-3.5 text-indigo-500 font-bold" />
              Confirm Sound Output
            </h4>
            <p className="text-[9.5px] text-slate-500 font-light leading-tight">
              Play standard security pilot tone to check speakers.
            </p>
          </div>
          <button
            type="button"
            onClick={triggerAudioToneHz}
            className={`h-8 px-3 rounded-lg text-[10px] uppercase font-mono font-bold tracking-wider transition-all cursor-pointer ${
              playTestTone 
                ? "bg-emerald-500 text-slate-950 font-black animate-pulse" 
                : isLight ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-indigo-650" : "bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300"
            }`}
          >
            {playTestTone ? "Playing Tone..." : "Test Audio"}
          </button>
        </div>

        {/* Core Calibration Confirmations */}
        <div className={`space-y-2 text-[10.5px] p-3 rounded-xl border transition-all ${isLight ? "text-slate-700 bg-slate-50 border-slate-200" : "text-slate-400 bg-slate-950/30 border-slate-850"}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${camPermission === "granted" ? "text-emerald-500" : "text-slate-500"}`} />
            <span>Actual/Simulated Webcam Feed Configured</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${micPermission === "granted" ? "text-emerald-400" : "text-slate-500"}`} />
            <span>Audio Analyser Node Initialized</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Active Gmail Authentication Hook Connected</span>
          </div>
        </div>

        {/* Trigger start room now */}
        <button
          onClick={handleLaunchInterview}
          className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15"
        >
          Start Mock Session & Stream Cam
          <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
        </button>
      </motion.div>
    </div>
  );
}

