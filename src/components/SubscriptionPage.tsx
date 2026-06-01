import React, { useState, useEffect } from "react";
import { Sparkles, Check, ChevronRight, CheckCircle, XCircle, Archive, Shield, HelpCircle, ArrowLeft, Sun, Moon } from "lucide-react";
import HireIqLogo from "./HireIqLogo";

interface SubscriptionPageProps {
  onNavigate: (path: string) => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}

export default function SubscriptionPage({ onNavigate, theme = "dark", toggleTheme }: SubscriptionPageProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<any | null>(null);

  // Dynamically load Sora font
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Pricing Data structure
  const prices = {
    free: {
      monthly: "Free",
      yearly: "Free",
      note: "No credit card required"
    },
    basic: {
      monthly: "₹2,499",
      yearly: "₹1,666.58",
      noteMonthly: "Billed monthly",
      noteYearly: "Billed ₹19,999 / year"
    },
    enterprise: {
      monthly: "₹5,999",
      yearly: "₹3,499.92", // We can use the higher high-fidelity numbers matching the HTML layout & scaling!
      noteMonthly: "Billed monthly",
      noteYearly: "Billed ₹41,999 / year"
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planName: string) => {
    if (planName === "Free") {
      onNavigate("/auth#signup");
      return;
    }

    setCheckoutError("");
    setCheckingOut(planName);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay checkout engine script failed to load. Check your internet connection.");
      }

      const billingInterval = isYearly ? "yearly" : "monthly";
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: planName,
          billingInterval: billingInterval
        })
      });

      if (!orderResponse.ok) {
        const errJson = await orderResponse.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to initialize subscription session with transaction center.");
      }

      const orderData = await orderResponse.json();

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "HireIQ AI Recruiting",
        description: `Upgrade to ${planName} Plan (${isYearly ? "Yearly" : "Monthly"})`,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planName: planName,
                billingInterval: billingInterval
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPaymentResult({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: orderData.amount,
                planName: planName,
                billing: billingInterval,
                simulated: orderData.simulated || false
              });
            } else {
              setCheckoutError(verifyData.error || "Transaction verification denied by transaction center.");
            }
          } catch (vErr: any) {
            setCheckoutError(vErr.message || "Failed to finalize sync with backend.");
          }
          setCheckingOut(null);
        },
        prefill: {
          name: "Abhay Client",
          email: "abbaabhayyy@gmail.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3D81E3"
        },
        modal: {
          ondismiss: function() {
            setCheckingOut(null);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.open();

    } catch (err: any) {
      console.error("Razorpay workflow failed:", err);
      setCheckoutError(err.message || "Failed to initiate payment gateway.");
      setCheckingOut(null);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isLight = theme === "light";

  return (
    <div className={`min-h-screen font-['Sora',sans-serif] relative z-10 selection:bg-blue-500/30 selection:text-white pb-20 pt-24 transition-colors duration-500 ${
      isLight ? "text-[#131518] bg-transparent" : "text-slate-100 bg-[#0c0c0c]/40"
    }`}>
      {/* Dynamic Top Fade-In Effect */}
      <div className={`absolute inset-x-0 top-0 h-40 pointer-events-none -z-10 transition-opacity duration-500 bg-gradient-to-b ${
        isLight ? "from-black/5 to-transparent" : "from-black/80 to-transparent"
      }`} />

      {/* NAVIGATION BAR */}
      <nav id="subscription_nav" className={`fixed top-0 left-0 right-0 z-50 h-24 flex items-center border-b transition-colors duration-500 backdrop-blur-lg ${
        isLight ? "bg-[#f8f8f6]/75 border-slate-200/50" : "bg-[#0c0c0c]/75 border-white/5"
      }`}>
        <div className="w-full max-w-[90rem] mx-auto px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent" onClick={() => onNavigate("/")}>
            <HireIqLogo theme={theme} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="flex items-center gap-2.5 md:gap-4 font-normal">
            <a href="#compare-plans-section" className={`text-xs transition-colors py-1.5 px-3 rounded-full hidden sm:inline-block ${
              isLight ? "text-black hover:bg-black/5" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>Features</a>
            <a href="#faq-section" className={`text-xs transition-colors py-1.5 px-3 rounded-full hidden sm:inline-block ${
              isLight ? "text-black hover:bg-black/5" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>Docs</a>
            <button 
              id="nav_back_btn"
              onClick={() => onNavigate("/")} 
              className={`flex items-center gap-1.5 text-xs border transition-all rounded-full px-4 py-1.5 font-medium cursor-pointer ${
                isLight ? "text-black hover:text-[#131518] hover:bg-black/5 border-slate-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button 
              id="nav_login_btn"
              onClick={() => onNavigate("/auth#login")} 
              className={`text-xs transition-all rounded-full px-5 py-2 font-semibold cursor-pointer ${
                isLight ? "bg-[#131518] text-white hover:bg-black" : "bg-white text-[#0c0c0c] hover:bg-slate-200"
              }`}
            >
              Admin Login
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

      <div className="max-w-[1100px] mx-auto px-6 md:px-8 mt-12 pb-12">
        {/* HEADER HERO */}
        <header id="pricing_header" className="text-center mb-14 max-w-2xl mx-auto space-y-4">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-[11px] font-medium uppercase tracking-wider transition-all duration-300 ${
            isLight ? "border-blue-400/35 bg-blue-50/70 text-blue-800" : "border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? "bg-blue-600" : "bg-cyan-300 shadow-[0_0_8px_#a4f4fd]"}`} />
            Simple, transparent pricing
          </div>
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] transition-colors duration-500 ${
            isLight ? "text-[#131518]" : "text-white"
          }`}>
            Pay for what your <br />
            <em className="normal-case not-italic italic font-light bg-gradient-to-r from-[#3D81E3] to-[#5ba3f8] bg-clip-text text-transparent">hiring team</em> actually needs
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed max-w-lg mx-auto transition-colors duration-500 ${
            isLight ? "text-black" : "text-slate-400"
          }`}>
            Every plan activates your full admin workspace. Upgrade, downgrade, or cancel any time — no lock-in.
          </p>
        </header>

        {/* BILLING TOGGLE */}
        <div id="billing_toggle_block" className="flex items-center justify-center gap-3.5 mb-14">
          <span 
            onClick={() => setIsYearly(false)}
            className={`text-xs font-semibold cursor-pointer select-none transition-colors duration-200 ${
              !isYearly ? (isLight ? "text-[#131518]" : "text-white") : (isLight ? "text-black font-normal hover:text-black" : "text-slate-500 hover:text-[#bbb]")
            }`}
          >
            Monthly
          </span>
          
          <button
            id="billing_toggle_switch"
            onClick={() => setIsYearly(!isYearly)}
            className={`w-[50px] h-[27px] rounded-full border p-0.5 transition-all relative cursor-pointer outline-none ${
              isYearly ? "bg-[#3D81E3]/40 border-[#3D81E3]/50" : (isLight ? "bg-slate-200 border-slate-300" : "bg-white/10 border-white/15")
            }`}
          >
            <div 
              className={`w-[21px] h-[21px] rounded-full bg-white shadow-lg transition-transform duration-350 ${
                isYearly ? "translate-x-[21px]" : "translate-x-0"
              }`}
            />
          </button>

          <span 
            onClick={() => setIsYearly(true)}
            className={`text-xs font-semibold cursor-pointer select-none transition-colors duration-200 ${
              isYearly ? (isLight ? "text-[#131518]" : "text-white") : (isLight ? "text-black font-normal hover:text-black" : "text-slate-500 hover:text-[#bbb]")
            }`}
          >
            Yearly
          </span>

          <span 
            id="save_discount_badge"
            className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-300 ${
              isLight ? "bg-blue-100 border border-blue-200 text-blue-800" : "bg-cyan-400/10 border border-cyan-400/30 text-cyan-300"
            } ${
              isYearly ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-1 scale-90 pointer-events-none"
            }`}
          >
            Save up to 30%
          </span>
        </div>

        {/* PLAN CARDS GRID */}
        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs text-center flex items-center justify-center gap-2 relative z-25">
            <XCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{checkoutError}</span>
          </div>
        )}
        <div id="pricing_grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 items-start">
          
          {/* FREE TRIAL CARD */}
          <div className={`transition-all duration-300 rounded-3xl p-7 relative group flex flex-col justify-between min-h-[520px] ${
            isLight 
              ? "bg-white border-2 border-black shadow-lg" 
              : "bg-white/[0.04] backdrop-blur-2xl border border-white/10 hover:border-white/20"
          }`}>
            {(!isLight) && <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-3xl" />}
            
            <div className="space-y-5 relative z-10">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-slate-650 text-slate-600" : "text-slate-450"}`}>Free Trial</span>
              <div className="space-y-1">
                <div className={`text-4xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Free</div>
                <div className={`font-mono text-[11px] ${isLight ? "text-slate-600" : "text-slate-500"}`}>{prices.free.note}</div>
              </div>
              <p className={`text-xs leading-relaxed min-h-[48px] ${isLight ? "text-slate-800" : "text-slate-400"}`}>
                Explore the platform and run up to 5 interview sessions. No payment details needed to get started.
              </p>
              
              <button 
                onClick={() => handleSubscribe("Free")}
                className={`w-full flex items-center justify-center gap-1.5 border transition-all font-semibold rounded-xl text-xs py-3 mt-4 cursor-pointer ${
                  isLight 
                    ? "border-black text-black hover:bg-black/5" 
                    : "border-white/20 hover:bg-white/5 hover:border-white/40 text-white"
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} />
                <span>Get started free</span>
              </button>
              
              <div className={`h-px my-4 ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
              
              <div className="space-y-3">
                <span className={`text-[9px] font-mono font-bold tracking-wider uppercase block ${isLight ? "text-black font-semibold" : "text-slate-505 text-slate-500"}`}>What&apos;s included</span>
                <ul className={`space-y-2.5 text-xs m-0 p-0 list-none ${isLight ? "text-black" : "text-slate-300"}`}>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Up to 5 interview sessions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>AI question generation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Basic scoring reports</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Email invite link</span>
                  </li>
                  <li className={`flex items-start gap-2.5 line-through ${isLight ? "text-black/40" : "text-slate-500"}`}>
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/5" : "bg-white/5 border border-white/5"}`}>—</span>
                    <span>No live proctoring</span>
                  </li>
                  <li className={`flex items-start gap-2.5 line-through ${isLight ? "text-black/40" : "text-slate-500"}`}>
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/5" : "bg-white/5 border border-white/5"}`}>—</span>
                    <span>No recordings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* BASIC — POPULAR CARD */}
          <div className={`transition-all duration-300 rounded-3xl p-7 relative group flex flex-col justify-between min-h-[520px] ${
            isLight 
              ? "bg-[#3D81E3]/5 border-2 border-black shadow-[0_20px_50px_rgba(61,129,227,0.12)] hover:border-black" 
              : "bg-[#3D81E3]/5 border-2 border-[#3D81E3]/45 shadow-[0_20px_50px_rgba(61,129,227,0.12)] hover:border-[#3D81E3]/75"
          }`}>
            {/* Popular Pill Label */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3D81E3] to-[#A4F4FD] text-black font-mono font-bold text-[9px] uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
              Most Popular
            </div>
            
            <div className="space-y-5 relative z-10 mt-2">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`}>Basic</span>
              <div className="space-y-1">
                <div className={`text-4xl font-extrabold tracking-tight flex items-baseline ${isLight ? "text-slate-900" : "text-white"}`}>
                   {isYearly ? prices.basic.yearly : prices.basic.monthly}
                  <sub className={`text-xs font-normal ml-1 ${isLight ? "text-slate-800" : "text-slate-400"}`}>/mo</sub>
                </div>
                <div className={isLight ? "text-black font-mono text-[11.5px]" : "text-slate-400 font-mono text-[11.5px]"}>
                  {isYearly ? prices.basic.noteYearly : prices.basic.noteMonthly}
                </div>
              </div>
              <p className={`text-xs leading-relaxed min-h-[48px] ${isLight ? "text-black" : "text-slate-300"}`}>
                For hiring teams running regular interview pipelines. Full AI, proctoring, and reports included.
              </p>
              
              <button 
                onClick={() => handleSubscribe("Basic")}
                disabled={checkingOut !== null}
                className="w-full flex items-center justify-center gap-1.5 bg-[#3D81E3] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold rounded-xl text-xs py-3 mt-4 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {checkingOut === "Basic" ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                )}
                <span>{checkingOut === "Basic" ? "Opening checkout..." : "Subscribe — Basic"}</span>
              </button>
              
              <div className={`h-px my-4 ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
              
              <div className="space-y-3">
                <span className={`text-[9px] font-mono font-bold tracking-wider uppercase block ${isLight ? "text-[#3D81E3] font-semibold" : "text-cyan-300"}`}>Everything in Free, plus</span>
                <ul className={`space-y-2.5 text-xs m-0 p-0 list-none ${isLight ? "text-black" : "text-slate-300"}`}>
                  <li className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-[#3D81E3]/20 border border-[#3D81E3]/35 shrink-0 mt-0.5"><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`} /></span>
                    <span>Up to 100 sessions / month</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-[#3D81E3]/20 border border-[#3D81E3]/35 shrink-0 mt-0.5"><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`} /></span>
                    <span>Live WebRTC proctoring</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-[#3D81E3]/20 border border-[#3D81E3]/35 shrink-0 mt-0.5"><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`} /></span>
                    <span>Session recordings</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-[#3D81E3]/20 border border-[#3D81E3]/35 shrink-0 mt-0.5"><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`} /></span>
                    <span>AI scoring + full transcripts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center bg-[#3D81E3]/20 border border-[#3D81E3]/35 shrink-0 mt-0.5"><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-[#A4F4FD]"}`} /></span>
                    <span>Email invite automation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* ENTERPRISE CARD */}
          <div className={`transition-all duration-300 rounded-3xl p-7 relative group flex flex-col justify-between min-h-[520px] ${
            isLight 
              ? "bg-white border-2 border-black shadow-lg hover:border-black" 
              : "bg-white/[0.04] backdrop-blur-2xl border border-white/10 hover:border-white/20"
          }`}>
            {(!isLight) && <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none rounded-3xl" />}
            
            <div className="space-y-5 relative z-10">
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400/80"}`}>Enterprise</span>
              <div className="space-y-1">
                <div className={`text-4xl font-extrabold tracking-tight flex items-baseline ${isLight ? "text-slate-900" : "text-white"}`}>
                  {isYearly ? prices.enterprise.yearly : prices.enterprise.monthly}
                  <sub className={`text-xs font-normal ml-1 ${isLight ? "text-slate-700" : "text-slate-400"}`}>/mo</sub>
                </div>
                <div className={`font-mono text-[11.5px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {isYearly ? prices.enterprise.noteYearly : prices.enterprise.noteMonthly}
                </div>
              </div>
              <p className={`text-xs leading-relaxed min-h-[48px] ${isLight ? "text-slate-750 text-slate-700" : "text-slate-400"}`}>
                For high-volume hiring orgs running multi-role pipelines with custom branding and SLA support.
              </p>
              
              <button 
                onClick={() => handleSubscribe("Enterprise")}
                disabled={checkingOut !== null}
                className={`w-full flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold rounded-xl text-xs py-3 mt-4 cursor-pointer ${
                  isLight 
                    ? "bg-[#131518] hover:bg-black text-white" 
                    : "bg-white hover:bg-slate-200 text-[#0c0c0c]"
                }`}
              >
                {checkingOut === "Enterprise" ? (
                  <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                    isLight ? "border-white" : "border-slate-950"
                  }`} />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                <span>{checkingOut === "Enterprise" ? "Opening checkout..." : "Subscribe — Enterprise"}</span>
              </button>
              
              <div className={`h-px my-4 ${isLight ? "bg-slate-200" : "bg-white/5"}`} />
              
              <div className="space-y-3">
                <span className={`text-[9px] font-mono font-bold tracking-wider uppercase block ${isLight ? "text-black font-semibold" : "text-slate-505 text-slate-500"}`}>Everything in Basic, plus</span>
                <ul className={`space-y-2.5 text-xs m-0 p-0 list-none ${isLight ? "text-black" : "text-slate-300"}`}>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Unlimited sessions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Multi-tenant workspace</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Custom question banks</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>White-label branding</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isLight ? "bg-black/5 border border-black/15" : "bg-white/5 border border-white/10"}`}><Check className={`w-2.5 h-2.5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></span>
                    <span>Priority SLA Support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* COMPARE DETAILED SECTIONS */}
        <section id="compare-plans-section" className="mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className={`text-2xl font-bold tracking-tight mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Compare Plans</h2>
            <div className={`text-xs ${isLight ? "text-black" : "text-slate-400"}`}>A full breakdown of what&apos;s included at each tier.</div>
          </div>

          <div className={`overflow-x-auto rounded-2xl border backdrop-blur-md transition-colors duration-500 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.02]"}`}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${isLight ? "border-slate-100 bg-slate-50/50" : "border-white/10 bg-white/[0.02]"}`}>
                  <th className={`p-4 font-semibold w-[40%] ${isLight ? "text-black" : "text-slate-300"}`}>Feature</th>
                  <th className={`p-4 font-semibold ${isLight ? "text-black" : "text-slate-400"}`}>Free Trial</th>
                  <th className={`p-4 font-semibold text-cyan-300 bg-[#3D81E3]/5 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`}>Basic</th>
                  <th className={`p-4 font-semibold ${isLight ? "text-black" : "text-slate-400"}`}>Enterprise</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-slate-100/80" : "divide-white/5"}`}>
                {/* INTERVIEW SESSIONS GROUP */}
                <tr className={isLight ? "bg-slate-50/70" : "bg-white/[0.03]"}>
                  <td colSpan={4} className={`p-2.5 font-mono text-[9px] tracking-wider uppercase font-semibold pl-4 ${isLight ? "text-black" : "text-slate-500"}`}>Interview Sessions</td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Sessions per month</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-400"}`}>5</td>
                  <td className={`p-4 font-semibold bg-[#3D81E3]/5 ${isLight ? "text-[#3D81E3]" : "text-white"}`}>100</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Unlimited</td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Bulk candidate upload</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-600"}`}>&mdash;</td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Timed access windows</td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>

                {/* AI & EVALUATION GROUP */}
                <tr className={isLight ? "bg-slate-50/70" : "bg-white/[0.03]"}>
                  <td colSpan={4} className={`p-2.5 font-mono text-[9px] tracking-wider uppercase font-semibold pl-4 ${isLight ? "text-black" : "text-slate-500"}`}>AI &amp; Evaluation</td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>AI question generation</td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>AI scoring + transcripts</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-400"}`}>Basic</td>
                  <td className={`p-4 font-semibold bg-[#3D81E3]/5 ${isLight ? "text-[#3D81E3]" : "text-white"}`}>Full</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Full + Custom</td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Custom question banks</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-600"}`}>&mdash;</td>
                  <td className={`p-4 bg-[#3D81E3]/5 ${isLight ? "text-black" : "text-slate-600"}`}>&mdash;</td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>

                {/* PROCTORING GROUP */}
                <tr className={isLight ? "bg-slate-50/70" : "bg-white/[0.03]"}>
                  <td colSpan={4} className={`p-2.5 font-mono text-[9px] tracking-wider uppercase font-semibold pl-4 ${isLight ? "text-black" : "text-slate-500"}`}>Proctoring &amp; Security</td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Live WebRTC proctoring</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-600"}`}>&mdash;</td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Session recordings</td>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-600"}`}>&mdash;</td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>
                <tr>
                  <td className={`p-4 ${isLight ? "text-black" : "text-slate-300"}`}>Anti-cheat safeguards</td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4 bg-[#3D81E3]/5"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                  <td className="p-4"><Check className={`w-4 h-4 ${isLight ? "text-[#3D81E3]" : "text-cyan-300"}`} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq-section" className="max-w-2xl mx-auto mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className={`text-2xl font-bold tracking-tight mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Frequently Asked Questions</h2>
            <div className={`text-xs ${isLight ? "text-black" : "text-slate-400"}`}>Everything you need to know before subscribing.</div>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I switch plans later?",
                a: "Yes. You can upgrade or downgrade at any time from your admin console. Changes take effect at the start of your next billing cycle."
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "The Free Trial plan lets you explore the platform with up to 5 sessions at no cost. No credit card is required to get started."
              },
              {
                q: "How does Razorpay checkout work?",
                a: "When you choose a paid plan, you'll be redirected to Razorpay's secure checkout. Once payment is verified, your workspace is activated immediately and you'll receive a confirmation email."
              },
              {
                q: "What happens if I exceed my session limit?",
                a: "New interview sessions will be paused until the next billing cycle resets your count, or you can upgrade to the next plan instantly from your admin console."
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes. Cancel anytime from your admin console settings. You'll retain access until the end of your current billing period with no further charges."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className={`border rounded-2xl transition-all duration-300 ${
                  isLight 
                    ? (openFaq === idx ? "border-[#3D81E3] bg-[#3D81E3]/5" : "border-slate-200 bg-white")
                    : (openFaq === idx ? "border-[#3D81E3]/50 bg-white/[0.02]" : "border-white/10 bg-white/[0.02]")
                }`}
              >
                <div 
                  onClick={() => toggleFaq(idx)}
                  className="p-5 flex justify-between items-center cursor-pointer select-none"
                >
                  <span className={`text-sm font-semibold transition-colors ${
                    isLight ? "text-black" : "text-slate-100 hover:text-white"
                  }`}>
                    {faq.q}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform duration-300 shrink-0 ${
                    isLight 
                      ? (openFaq === idx ? "bg-[#3D81E3]/15 border-[#3D81E3] text-[#3D81E3]" : "bg-slate-100 border-slate-200 text-black")
                      : (openFaq === idx ? "bg-[#3D81E3]/20 border-[#3D81E3]/40 text-[#3D81E3]" : "bg-white/5 border-white/15 text-slate-400")
                  } ${openFaq === idx ? "rotate-180" : ""}`}>
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                </div>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out text-xs leading-relaxed px-5 ${
                    openFaq === idx ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                  } ${isLight ? "text-black" : "text-slate-400"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION CARD */}
        <section id="cta-block" className={`relative group overflow-hidden rounded-[32px] p-10 md:p-14 text-center backdrop-blur-xl border transition-all duration-300 ${
          isLight 
            ? "bg-white border-2 border-black shadow-lg" 
            : "bg-white/[0.02] border-white/10"
        }`}>
          {(!isLight) && <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(61,129,227,0.12),transparent_70%)] pointer-events-none" />}
          
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight ${
            isLight ? "text-black" : "text-white"
          }`}>
            Ready to <em className="not-italic italic font-light bg-gradient-to-r from-[#A4F4FD] to-[#3D81E3] bg-clip-text text-transparent">transform</em> <br className="sm:hidden" />
            your hiring pipeline?
          </h2>
          <p className={`text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed font-light ${
            isLight ? "text-black" : "text-slate-400"
          }`}>
            Start free, scale when you need to. Your full workspace is one checkout away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              onClick={() => handleSubscribe("Free")}
              className={`w-full sm:w-auto px-7 h-11 inline-flex items-center justify-center gap-2 rounded-full font-extrabold text-xs tracking-tight transition-all cursor-pointer shadow-md hover:scale-[1.01] ${
                isLight 
                  ? "bg-black hover:bg-black/90 text-white" 
                  : "bg-white hover:bg-slate-200 text-black"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLight ? "text-white" : "text-black"}`} />
              <span>Start for free</span>
            </button>
            <button 
              onClick={() => onNavigate("/auth#login")}
              className={`w-full sm:w-auto px-6 h-11 inline-flex items-center justify-center text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                isLight 
                  ? "border-black text-black hover:bg-black/5" 
                  : "border-white/15 bg-transparent hover:bg-white/5 text-slate-300"
              }`}
            >
              <span>Admin Login</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </section>

      </div>

      {/* Dynamic Payment Success Dialog Overlay */}
      {paymentResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="max-w-md w-full border p-8 rounded-[2rem] relative shadow-2xl text-left bg-slate-900 border-white/10 text-white animate-scale-up">
            {/* Top glowing success line bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-t-[2rem]" />

            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Upgrade Confirmed!</h2>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-extrabold pb-1">Transaction Verified Securely</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed font-light text-center">
                Your HireIQ client account is now upgraded. The checkout transaction has cleared, activating your full technical proctoring workspace.
              </p>

              <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl space-y-2.5 font-mono text-[11px] text-slate-500">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Activated Plan:</span>
                  <span className="text-white font-bold">{paymentResult.planName} ({paymentResult.billing === "yearly" ? "Yearly" : "Monthly"})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Transaction ID:</span>
                  <span className="text-emerald-400 truncate max-w-[180px]">{paymentResult.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Order Key Reference:</span>
                  <span className="text-slate-350 truncate max-w-[180px]">{paymentResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cleared:</span>
                  <span className="text-white font-bold">₹{paymentResult.amount / 100} INR</span>
                </div>
              </div>

              {paymentResult.simulated && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <p className="text-[10px] text-blue-300 leading-normal font-light">
                    ℹ️ <strong>Sandbox Mode Active:</strong> This checkout was processed in test simulation mode because credentials were not supplied in system secrets. Your simulation workspace is functional!
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setPaymentResult(null);
                  onNavigate("/app");
                }}
                className="w-full h-11 bg-[#3D81E3] hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/15 text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
