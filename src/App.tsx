import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ResumeUpload from "./components/ResumeUpload";
import NewInterview from "./components/NewInterview";
import InterviewRoom from "./components/InterviewRoom";
import ReportPage from "./components/ReportPage";
import ThreeParticleBackground from "./components/ThreeParticleBackground";
import CandidateInviteGate from "./components/CandidateInviteGate";
import SubscriptionPage from "./components/SubscriptionPage";
import { mockDb } from "./lib/mockDb";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://hdlnvmbmknpjpjektsgu.supabase.co";
const SUPA_KEY = "sb_publishable_ITm0crZPvxM2wGFC3IeJ9g_NiAr4Dcg";
const supabase = createClient(SUPA_URL, SUPA_KEY);

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("ai_mock_interview_theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("ai_mock_interview_theme", next);
      return next;
    });
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("ai_mock_interview_auth") === "true";
  });

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
          console.log("Supabase OAuth success on App mount! Integrating Google profile:", session.user);
          
          const profile = mockDb.getProfile();
          profile.full_name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Google User";
          profile.email = session.user.email || "";
          
          const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (avatar) {
            profile.avatar_url = avatar;
          }
          mockDb.updateProfile(profile);

          localStorage.setItem("ai_mock_interview_auth", "true");
          setIsAuthenticated(true);
          
          if (window.location.hash && window.location.hash.includes("access_token")) {
            try {
              window.history.replaceState(null, "", window.location.pathname);
            } catch (err) {
              console.warn("Could not sweep access token hash:", err);
            }
          }

          navigate("/app");
        }
      } catch (e) {
        console.error("Error checking Supabase session:", e);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        console.log("Supabase Auth State trigger in App:", event, session.user);
        
        const profile = mockDb.getProfile();
        profile.full_name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Google User";
        profile.email = session.user.email || "";
        
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
        if (avatar) {
          profile.avatar_url = avatar;
        }
        mockDb.updateProfile(profile);

        localStorage.setItem("ai_mock_interview_auth", "true");
        setIsAuthenticated(true);
        
        if (window.location.hash && window.location.hash.includes("access_token")) {
          try {
            window.history.replaceState(null, "", window.location.pathname);
          } catch (err) {
            console.warn("Could not sweep access token hash:", err);
          }
        }

        navigate("/app");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Track popstate changes (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Secure path redirects
  useEffect(() => {
    const isAppPath = currentPath.startsWith("/app");
    if (isAppPath && !isAuthenticated) {
      // Allow bypass if an active invite bypass key exists in localStorage for this interview ID
      const interviewMatch = currentPath.match(/^\/app\/interview\/([^\/]+)$/);
      const isBypassed = interviewMatch && localStorage.getItem("invite_bypass_" + interviewMatch[1]) === "true";
      if (!isBypassed) {
        navigate("/auth");
      }
    } else if (currentPath === "/auth" && isAuthenticated) {
      navigate("/app");
    }
  }, [currentPath, isAuthenticated]);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    const basePath = path.split(/[?#]/)[0];
    setCurrentPath(basePath);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate("/app");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase forced signout warning:", err);
    }
    localStorage.removeItem("ai_mock_interview_auth");
    setIsAuthenticated(false);
    navigate("/");
  };

  // Path Routing parsing
  const getRenderedPage = () => {
    if (currentPath === "/") {
      return (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage onNavigate={navigate} isAuthenticated={isAuthenticated} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
        </motion.div>
      );
    }

    if (currentPath === "/auth") {
      return (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AuthPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} theme={theme} toggleTheme={toggleTheme} />
        </motion.div>
      );
    }

    if (currentPath === "/subscription") {
      return (
        <motion.div
          key="subscription"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SubscriptionPage onNavigate={navigate} theme={theme} toggleTheme={toggleTheme} />
        </motion.div>
      );
    }

    // Secure Dashboard path route
    if (currentPath === "/app") {
      return (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Dashboard onNavigate={navigate} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
        </motion.div>
      );
    }

    // Secure Resume Parsing paths
    if (currentPath === "/app/resume") {
      return (
        <motion.div
          key="resume"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResumeUpload onNavigate={navigate} theme={theme} />
        </motion.div>
      );
    }

    // Secure New interview configuration paths
    if (currentPath === "/app/interview/new") {
      return (
        <motion.div
          key="new_interview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NewInterview onNavigate={navigate} theme={theme} />
        </motion.div>
      );
    }

    // Match subpath structures using regular expressions
    // Match Report Page first: /app/interview/:id/report
    const reportMatch = currentPath.match(/^\/app\/interview\/([^\/]+)\/report$/);
    if (reportMatch) {
      const interviewId = reportMatch[1];
      return (
        <motion.div
          key="report_page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReportPage interviewId={interviewId} onNavigate={navigate} theme={theme} />
        </motion.div>
      );
    }

    // Match Live Room: /app/interview/:id
    const liveMatch = currentPath.match(/^\/app\/interview\/([^\/]+)$/);
    if (liveMatch) {
      const interviewId = liveMatch[1];
      return (
        <motion.div
          key="interview_room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InterviewRoom interviewId={interviewId} onNavigate={navigate} theme={theme} />
        </motion.div>
      );
    }

    // Match Invite Link: /invite/:id
    const inviteMatch = currentPath.match(/^\/invite\/([^\/]+)$/);
    if (inviteMatch) {
      const interviewId = inviteMatch[1];
      return (
        <motion.div
          key="invite_gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CandidateInviteGate interviewId={interviewId} onNavigate={navigate} theme={theme} />
        </motion.div>
      );
    }

    // Default Fallback path router
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-xl font-bold font-display text-white">404: Path Not Found</h2>
        <p className="text-xs text-slate-400">The referenced visual route sandbox has been relocated.</p>
        <button
          onClick={() => navigate("/")}
          className="h-10 px-5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 font-mono text-xs uppercase transition-colors"
        >
          Back to Overview
        </button>
      </div>
    );
  };

  return (
    <div className={`min-h-screen overflow-x-hidden relative transition-colors duration-500 ${theme === "light" ? "bg-[#f8f8f6] text-[#1a1a18]" : "bg-slate-950 text-slate-100"}`}>
      <ThreeParticleBackground theme={theme} />
      <AnimatePresence mode="wait">
        {getRenderedPage()}
      </AnimatePresence>
    </div>
  );
}
