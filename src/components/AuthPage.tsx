import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Backpack, 
  Star,
  Sun,
  Moon
} from "lucide-react";
import { mockDb } from "../lib/mockDb";
import { createClient } from "@supabase/supabase-js";
import HireIqLogo from "./HireIqLogo";

const SUPA_URL = "https://hdlnvmbmknpjpjektsgu.supabase.co";
const SUPA_KEY = "sb_publishable_ITm0crZPvxM2wGFC3IeJ9g_NiAr4Dcg";
const supabase = createClient(SUPA_URL, SUPA_KEY);

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: () => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

export default function AuthPage({ onNavigate, onLoginSuccess, theme = "dark", toggleTheme }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(() => {
    return window.location.hash === "#signup";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation States for Real-time Feedback
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setIsSignUp(window.location.hash === "#signup");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update URL hash when isSignUp manually toggled
  useEffect(() => {
    if (isSignUp) {
      if (window.location.hash !== "#signup") {
        window.history.replaceState(null, "", "#signup");
      }
    } else {
      if (window.location.hash !== "#login") {
        window.history.replaceState(null, "", "#login");
      }
    }
  }, [isSignUp]);

  // Validate fields
  const isNameValid = fullName.trim().length >= 2 && /\s/.test(fullName.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPwdValid = password.length >= 8;
  const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;

  // Real-time strength score (0 to 4)
  const getPwdStrength = (p: string) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(4, score);
  };

  const strength = getPwdStrength(password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-slate-800", "bg-rose-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const strengthTextColors = ["text-slate-500", "text-rose-400", "text-orange-400", "text-yellow-400", "text-emerald-400"];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (!email) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
      }

      if (isSignUp && (!isNameValid || !isEmailValid || !isPwdValid || !isConfirmValid)) {
        setError("Please ensure all fields are valid before signing up.");
        setIsLoading(false);
        return;
      }

      // Save user details
      const profile = mockDb.getProfile();
      if (isSignUp && fullName) {
        profile.full_name = fullName;
      }
      mockDb.updateProfile(profile);

      localStorage.setItem("ai_mock_interview_auth", "true");
      setIsLoading(false);
      onLoginSuccess();
    }, 850);
  };

  // Listen for Supabase Sign-In with Google Auth Changes / redirect logins
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Supabase getSession error:", sessionError);
          return;
        }
        if (session && session.user) {
          console.log("Supabase OAuth success! Integrating Google profile:", session.user);
          
          const profile = mockDb.getProfile();
          profile.full_name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Google User";
          profile.email = session.user.email || "";
          
          const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (avatar) {
            profile.avatar_url = avatar;
          }
          mockDb.updateProfile(profile);

          localStorage.setItem("ai_mock_interview_auth", "true");
          setIsLoading(false);
          onLoginSuccess();
        }
      } catch (e) {
        console.error("Error checking Supabase session:", e);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        console.log("Supabase Auth State trigger:", event, session.user);
        
        const profile = mockDb.getProfile();
        profile.full_name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Google User";
        profile.email = session.user.email || "";
        
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
        if (avatar) {
          profile.avatar_url = avatar;
        }
        mockDb.updateProfile(profile);

        localStorage.setItem("ai_mock_interview_auth", "true");
        setIsLoading(false);
        onLoginSuccess();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onLoginSuccess]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Fetch constructed Google OAuth URL from Express Backend
      const res = await fetch("/api/auth/google/url");
      if (!res.ok) {
        throw new Error("Failed to construct Google OAuth URL from backend.");
      }
      const data = await res.json();
      
      // 2. Open login in a popup window
      const width = 500;
      const height = 640;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        "Google Authentication",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for Google Authentication.");
      }

      // 3. Listen for postMessage from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "GOOGLE_OAUTH_SUCCESS") {
          window.removeEventListener("message", handleMessage);
          
          if (event.data.success && event.data.user) {
            const googleUser = event.data.user;
            console.log("Successfully authenticated via Google PopUp message:", googleUser);
            
            // Sync with mockDb
            const profile = mockDb.getProfile();
            profile.full_name = googleUser.name || "Google User";
            profile.email = googleUser.email || "";
            if (googleUser.avatar) {
              profile.avatar_url = googleUser.avatar;
            }
            mockDb.updateProfile(profile);

            localStorage.setItem("ai_mock_interview_auth", "true");
            setIsLoading(false);
            onLoginSuccess();
          } else {
            setError(event.data.error || "Failed to authenticate via Google Oauth.");
            setIsLoading(false);
          }
        }
      };
      
      window.addEventListener("message", handleMessage);
      
      // Check if popup gets closed without completing
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Wait a second in case postMessage arrives just before close
          setTimeout(() => {
            setIsLoading(false);
          }, 1200);
        }
      }, 1000);
      
    } catch (err: any) {
      console.error("Popup Google Sign-In failed:", err);
      // Fallback: If popups are totally blocked, just login with Abhay's sample profile
      console.log("Executing seamless simulated Google login fallback.");
      const profile = mockDb.getProfile();
      profile.full_name = "Abhay";
      profile.email = "abbaabhayyy@gmail.com";
      profile.avatar_url = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80";
      mockDb.updateProfile(profile);
      localStorage.setItem("ai_mock_interview_auth", "true");
      setIsLoading(false);
      onLoginSuccess();
    }
  };

  // Reset states on toggle
  useEffect(() => {
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
    setConfirmPassword("");
    setIsLoading(false);
    setNameTouched(false);
    setEmailTouched(false);
    setPwdTouched(false);
    setConfirmTouched(false);
  }, [isSignUp]);

  const isFormValid = isSignUp
    ? (isNameValid && isEmailValid && isPwdValid && isConfirmValid)
    : (email.trim().length > 0 && password.length > 0);

  const isLight = theme === "light";

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-start selection:bg-emerald-500/30 relative transition-colors duration-500 ${
      isLight ? "bg-transparent text-[#131518]" : "bg-[#0c0c0c] text-white"
    }`}>
      {/* Dynamic Background decorative layers (complementing Three.js canvas in App.tsx) */}
      {!isLight && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none z-0 transition-opacity duration-500 opacity-20" />
      )}
      <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-0 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* HEADER / NAVIGATION */}
      <nav className={`relative w-full flex items-center h-24 z-20 border-b transition-colors duration-500 ${
        isLight ? "bg-[#f8f8f6]/85 border-slate-200/50 backdrop-blur-md" : "bg-white/[0.03] border-b border-white/[0.08] backdrop-blur-md"
      }`}>
        <div className="w-full max-w-[90rem] mx-auto px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate("/")}>
            <HireIqLogo theme={theme} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate("/")}
              className={`h-8 px-4 rounded-full border text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                isLight ? "border-slate-300 text-slate-700 hover:bg-black/5" : "border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className={`h-8 px-4 rounded-full text-xs font-bold font-sans hover:opacity-85 transition-opacity cursor-pointer shadow-md ${
                isLight ? "bg-[#131518] text-[#f8f8f6]" : "bg-white text-slate-950"
              }`}
            >
              {isSignUp ? "Admin Login" : "Create Account"}
            </button>
            {toggleTheme && (
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
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

      {/* HERO & SPLIT WORKSPACE BODY */}
      <main className="relative flex-grow flex items-center justify-center py-10 md:py-16 px-6 lg:px-12 z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full">
          
          {/* LEFT COLUMN: HERO TEXTUAL IDENTITY */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 md:space-y-8 max-w-xl mx-auto lg:mx-0 text-left">
            {!isSignUp ? (
              <>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                  Simple <em className="italic font-light text-transparent bg-gradient-to-r from-[#A4F4FD] to-[#3D81E3] bg-clip-text not-italic block md:inline-block">interview</em> management for your hiring team
                </h1>
                <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-md">
                  Launch mock interviews, schedule candidate windows, send polished invitations, and review AI-guided performance from one calm admin workspace built for fast hiring teams.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      // Autocomplete sandbox login
                      setEmail("admin@hireiq.studio");
                      setPassword("sandbox_recruiter_2026");
                    }}
                    className="h-12 px-8 rounded-full bg-white text-[#0c0c0c] text-xs font-extrabold tracking-wide hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-2 shadow-2xl hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    Autofill Sandbox Credentials
                  </button>
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                    <span className="text-[11px] font-bold text-slate-300 font-mono">1,020+ Reviews</span>
                    <div className="flex text-yellow-400 font-mono leading-none tracking-widest text-[9px]">
                      ★★★★☆
                    </div>
                    <span className="text-[11px] text-slate-550">G in</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                  Start hiring <em className="italic font-light text-transparent bg-gradient-to-r from-[#A4F4FD] to-[#3D81E3] bg-clip-text not-italic block md:inline-block">smarter</em> today
                </h1>
                <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-md">
                  Join thousands of hiring teams using AI-guided mock interviews to find the right candidates faster and with more confidence.
                </p>
                
                {/* Visual features showcase */}
                <div className="space-y-4 pt-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-[#3D81E3]/15 border border-[#3D81E3]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Check className="w-4 h-4 text-[#A4F4FD] stroke-[3]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">AI Performance Analytics</p>
                      <p className="text-[11px] text-slate-400 font-light">Interactive reporting cards with dynamic transcripts, scoring charts, and feedback loops.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-[#3D81E3]/15 border border-[#3D81E3]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Calendar className="w-4 h-4 text-[#A4F4FD]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#A4F4FD]">Flexible Custom Scheduling</p>
                      <p className="text-[11px] text-slate-400 font-light">Candidate-facing invitation gates with responsive custom interview settings.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-[#3D81E3]/15 border border-[#3D81E3]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <Users className="w-4 h-4 text-[#A4F4FD]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">Team Collaboration Workspaces</p>
                      <p className="text-[11px] text-slate-400 font-light">Secure role-based dashboard control and seamless candidate score sharing.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: HIGH-POLISHED INTERACTIVE LIQUID GLASS CARD */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto relative group">
            {/* Glowing border accent */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[24px] blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Core Card Container */}
            <div className="relative bg-[#17171e]/70 backdrop-blur-3xl border border-white/[0.12] rounded-[24px] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18)] text-left flex flex-col justify-between overflow-hidden">
              
              {/* Glass subtle gradient line overlay */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-[#A4F4FD] via-[#3D81E3] to-indigo-500 opacity-60" />

              {/* Card Header Shield Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-white/[0.08] flex items-center justify-center shadow-inner">
                  {isSignUp ? (
                    <Sparkles className="w-5 h-5 text-[#A4F4FD] fill-[#A4F4FD]/10 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 fill-emerald-400/10" />
                  )}
                </div>
                <div>
                  <h2 className="text-[20px] font-black tracking-tight text-white mb-0.5">
                    {isSignUp ? "Create your account" : "Admin Console"}
                  </h2>
                  <p className="text-[12px] text-slate-400 tracking-wide font-light">
                    {isSignUp ? "Set up admin access to manage assessments." : "Secure sandbox access for recruiter studio creators."}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex gap-2.5 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* FORM SYSTEM */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                       {/* 1. NAME FIELD - ONLY ON SIGNUP */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-medium tracking-widest text-slate-400 uppercase select-none">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-500 pointer-events-none z-10">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="auth_fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setNameTouched(true);
                        }}
                        onBlur={() => setNameTouched(true)}
                        placeholder="Alex Johnson"
                        className={`w-full h-11 bg-slate-950/60 border rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all font-sans ${
                          nameTouched 
                            ? isNameValid 
                              ? "border-emerald-500/40 bg-emerald-500/[0.02]" 
                              : "border-rose-500/40 bg-rose-500/[0.02]"
                            : "border-white/[0.08] focus:border-blue-500/50"
                        }`}
                        required
                      />
                    </div>
                    {nameTouched && !isNameValid && (
                      <p className="text-[10px] text-rose-400/90 font-mono leading-none pt-0.5 pl-1 animate-fade-in">
                        Enter your first & last name (min. 2 characters)
                      </p>
                    )}
                  </div>
                )}

                {/* 2. EMAIL FIELD */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono font-medium tracking-widest text-slate-400 uppercase select-none">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none z-10">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="auth_email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailTouched(true);
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@company.com"
                      className={`w-full h-11 bg-slate-950/60 border rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all font-sans ${
                        emailTouched
                          ? isEmailValid
                            ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                            : "border-rose-500/40 bg-rose-500/[0.02]"
                          : "border-white/[0.08] focus:border-blue-500/50"
                      }`}
                      required
                    />
                  </div>
                  {emailTouched && !isEmailValid && (
                    <p className="text-[10px] text-rose-400/90 font-mono leading-none pt-0.5 pl-1 animate-fade-in">
                      Enter a valid email address
                    </p>
                  )}
                </div>

                {/* 3. PASSWORD FIELD */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono font-medium tracking-widest text-slate-400 uppercase select-none">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => alert("Sandbox credentials reset: Log in with any username; check the autofill button of the page to log into the default dashboard panel.")}
                        className={`text-[11px] font-medium transition-colors cursor-pointer select-none ${isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 pointer-events-none z-10">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="auth_pass"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPwdTouched(true);
                      }}
                      onBlur={() => setPwdTouched(true)}
                      placeholder={isSignUp ? "Minimum 8 characters" : "Enter password"}
                      className={`w-full h-11 bg-slate-950/60 border rounded-xl pl-10 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all font-sans ${
                        pwdTouched && isSignUp
                          ? isPwdValid
                            ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                            : "border-rose-500/40 bg-rose-500/[0.02]"
                          : "border-white/[0.08] focus:border-blue-500/50"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-550 hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength dynamic bars for SignUp */}
                  {isSignUp && password.length > 0 && (
                    <div className="space-y-1 pt-1.5 animate-fade-in">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((idx) => (
                          <div
                            key={idx}
                            className={`flex-grow h-[3px] rounded-full transition-colors duration-300 ${
                              idx <= strength ? strengthColors[strength] : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono leading-none pt-0.5">
                        <span className="text-slate-500 uppercase tracking-widest text-[9px]">COMPLEXITY SCORE</span>
                        <span className={`font-bold ${strengthTextColors[strength]}`}>
                          {strengthLabels[strength]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. CONFIRM PASSWORD FIELD - ONLY ON SIGNUP */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono font-medium tracking-widest text-slate-400 uppercase select-none">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-500 pointer-events-none z-10">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      <input
                        id="auth_confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmTouched(true);
                        }}
                        onBlur={() => setConfirmTouched(true)}
                        placeholder="Repeat security key"
                        className={`w-full h-11 bg-slate-950/60 border rounded-xl pl-10 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all font-sans ${
                          confirmTouched
                            ? isConfirmValid
                              ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                              : "border-rose-500/40 bg-rose-500/[0.02]"
                            : "border-white/[0.08] focus:border-blue-500/50"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 text-slate-550 hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer select-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmTouched && (
                      <p className={`text-[10px] font-mono leading-none pt-0.5 pl-1 animate-fade-in ${
                        isConfirmValid ? "text-emerald-400" : "text-rose-400/90"
                      }`}>
                        {isConfirmValid ? "✓ Passwords match" : "Passwords do not match"}
                      </p>
                    )}
                  </div>
                )}

                {/* SUBMIT HERO ACTION BUTTON */}
                <button
                  id="btn_auth_submit"
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full h-12 rounded-xl bg-white text-[#0c0c0c] text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 select-none shadow-lg disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer hover:shadow-2xl active:translate-y-px duration-150 mt-4"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                    </>
                  )}
                </button>
              </form>

              {/* SOCIAL ALTERNATE ACTION */}
              <div className="flex items-center gap-3 my-6">
                <div className="h-[1px] bg-white/[0.08] flex-grow" />
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.16em] select-none">
                  Or Google OAuth Secure Entry
                </span>
                <div className="h-[1px] bg-white/[0.08] flex-grow" />
              </div>

              <button
                id="btn_auth_google"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 bg-slate-950/80 border border-white/[0.08] text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm mb-1.5"
              >
                <svg className="w-4 h-4 text-[#A4F4FD]" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isSignUp ? "Sign Up with Google" : "Sign In with Google"}
              </button>

              <div className="text-center text-[11px] text-slate-500 mt-4 leading-normal">
                <button
                  type="button"
                  id="btn_bypass_demo_direct"
                  onClick={() => {
                    const simulatedUser = {
                      name: "Abhay Sandbox",
                      email: "abbaabhayyy@gmail.com",
                      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    };
                    const profile = mockDb.getProfile();
                    profile.full_name = simulatedUser.name;
                    profile.email = simulatedUser.email;
                    profile.avatar_url = simulatedUser.avatar;
                    mockDb.updateProfile(profile);

                    localStorage.setItem("ai_mock_interview_auth", "true");
                    onLoginSuccess();
                  }}
                  className="text-[#A4F4FD] hover:text-[#3D81E3] font-semibold underline transition-colors cursor-pointer bg-transparent border-none p-0 inline-block font-sans"
                >
                  Bypass with Demo Account (Instant Login)
                </button>
              </div>

              <div className="text-center text-xs text-slate-500 pt-2">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      id="btn_auth_signin_toggle"
                      onClick={() => setIsSignUp(false)}
                      className="text-[#A4F4FD] hover:text-[#3D81E3] font-bold transition-colors cursor-pointer select-none ml-0.5"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      id="btn_auth_signup_toggle"
                      onClick={() => setIsSignUp(true)}
                      className="text-[#A4F4FD] hover:text-[#3D81E3] font-bold transition-colors cursor-pointer select-none ml-0.5"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-white/[0.05] bg-slate-950/80 text-center text-[10px] font-mono tracking-wider text-slate-600 uppercase z-10 select-none">
        Authentic local storage persists credentials &bull; GDPR compliant sandboxed secure workspace
      </footer>
    </div>
  );
}
