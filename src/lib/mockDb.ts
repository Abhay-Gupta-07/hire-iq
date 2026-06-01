import { Interview, InterviewQuestion, InterviewReport, ResumeData, UserProfile } from "../types";

const PROFILE_KEY = "ai_mock_interview_profile";
const RESUMES_KEY = "ai_mock_interview_resumes";
const INTERVIEWS_KEY = "ai_mock_interview_interviews";
const QUESTIONS_KEY = "ai_mock_interview_questions";
const REPORTS_KEY = "ai_mock_interview_reports";

// Seed sample resumes
const SEED_RESUMES: ResumeData[] = [
  {
    id: "sample_frontend",
    user_id: "client_user",
    filename: "Alex_Rodriguez_Frontend_Developer.pdf",
    ats_score: 87,
    strengths: [
      "Extensive React 19 and custom hook implementation",
      "Robust state management and client audio integration experience",
      "Commitment to standard-aligned clean semantic layouts",
    ],
    weaknesses: [
      "Could include more performance optimization metrics (e.g., bundle size reduction percentiles)",
      "Backend API development history is less detailed",
    ],
    suggestions: [
      "Add direct web application analytics details or Lighthouse audit benchmarks",
      "Integrate mentions of robust unit testing coverage (Jest, Vitest)",
    ],
    parsed: {
      name: "Alex Rodriguez",
      skills: ["React", "TypeScript", "Tailwind CSS", "Vite", "Node.js", "Web Audio API"],
      experienceCount: 5,
      education: ["B.S. in Computer Science - Seattle University"],
    },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sample_pm",
    user_id: "client_user",
    filename: "Alex_Rodriguez_Technical_Product_Manager.pdf",
    ats_score: 93,
    strengths: [
      "Highly quantitative impact statements with outstanding growth metrics",
      "Exceptional multi-functional cross Team collaboration representation",
      "Technical background allows detailed scoping with engineering",
    ],
    weaknesses: [
      "Slightly wordy narrative structure in work experience sections",
    ],
    suggestions: [
      "Be more direct in product management action verbs (e.g. Lead, Architect, Drive)",
    ],
    parsed: {
      name: "Alex Rodriguez",
      skills: ["Agile Development", "Product Strategy", "System Architecture", "Google Analytics", "SQL"],
      experienceCount: 6,
      education: ["M.S. in Product Management - Carnegie Mellon University"],
    },
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Seed completed past interviews & reports
const SEED_INTERVIEWS: Interview[] = [
  {
    id: "interview_past_1",
    user_id: "client_user",
    resume_id: "sample_frontend",
    candidate_name: "Alex Rodriguez",
    role: "Senior Frontend Engineer",
    difficulty: "medium",
    total_questions: 3,
    current_question_idx: 3,
    status: "completed",
    started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
  }
];

const SEED_QUESTIONS: InterviewQuestion[] = [
  {
    id: "past_q1",
    interview_id: "interview_past_1",
    idx: 0,
    question: "Alex, I notice you have extensive experience building scalable user interfaces in React. What are the key strategies you leverage to handle rapid media inputs and avoid unneeded components re-renders?",
    answer_transcript: "To prevent unnecessary re-renders in heavy React apps, I usually rely on useMemo and useCallback for computationally costly procedures or callbacks passed to memoized children. I also decouple heavy local interactions like transcription or audio recording into specialized custom hooks with ref-based storage when immediate re-renders are not required.",
    scores: {
      communication: 9,
      technical: 8,
      confidence: 8,
      score: 84,
      feedback: "Highly detailed and accurate explanation. Highlighting the separation between visual render loops and state holds via useRef was excellent.",
    }
  },
  {
    id: "past_q2",
    interview_id: "interview_past_1",
    idx: 1,
    question: "How do you approach real-time recording and processing of Web Audio APIs, and ensure compatibility with modern mobile and desktop browsers?",
    answer_transcript: "I create specialized streams using getUserMedia. Once the MediaRecorder produces the Opus bytes, I convert the chunks into standard lossless WAV buffers. Desktop browsers handle AudioContext excellently. For mobile safaris and browsers, we have to unlock synthesizers and speech engines inside direct user touches.",
    scores: {
      communication: 8,
      technical: 9,
      confidence: 9,
      score: 87,
      feedback: "Superb answer detailing specific browser constraints and touch gesture locks. Very accurate technical alignment.",
    }
  },
  {
    id: "past_q3",
    interview_id: "interview_past_1",
    idx: 2,
    question: "Can you detail a behavioral instance where a layout deadline conflicted with clean modular standards? How did you resolve the trade-off?",
    answer_transcript: "Well, we had minor client deliverables approaching. Instead of creating a messy monolithic codebase, I spent an initial hour sketching out dry interfaces, then delegated standard helper classes. We met the layout deadline while ensuring components stayed separate and easily testable.",
    scores: {
      communication: 9,
      technical: 8,
      confidence: 8,
      score: 83,
      feedback: "Brilliant behavioral answer demonstrating leadership, active architectural division of work, and modular discipline.",
    }
  }
];

const SEED_REPORT: InterviewReport = {
  id: "rep_past_1",
  interview_id: "interview_past_1",
  overall_score: 85,
  communication: 9,
  technical: 8,
  confidence: 8,
  recommendation: "Strong Hire",
  summary_md: `### Executive Summary

Alex performed exceptionally well on the Senior Frontend Engineer interview. His answers demonstrated high structural comprehension of React, state performance, and clean audio browser pipeline architectures. He communicated with professional clarity, maintaining consistent confidence throughout.

### Core Strengths
- **Sublime State Comprehension**: Showed exceptional awareness of render loops and ref optimization.
- **Vocal Clarity**: Provided highly articulate, organized responses.
- **Technical Competencies**: Highlighted deep understanding of browser sandbox limitations and AudioContext lifecycles.

### Key Growth Opportunities
- **Architectural Scaling**: Could elaborate more on visual performance audits and Core Web Vital indicators.
- **Testing Practices**: Focus on explaining integration testing with audio capture objects.

### Professional Career Advice
- Leverage the Web Audio specialization for interactive, AI-driven frontends.
- Frame system design discussions around scalable modular state-charts.`,
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 16 * 60 * 1000).toISOString(),
};

// Local storage helpers
export const mockDb = {
  initialize() {
    if (!localStorage.getItem(PROFILE_KEY)) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        id: "client_user",
        full_name: "Alex Rodriguez",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      }));
    }
    if (!localStorage.getItem(RESUMES_KEY)) {
      localStorage.setItem(RESUMES_KEY, JSON.stringify(SEED_RESUMES));
    }
    if (!localStorage.getItem(INTERVIEWS_KEY)) {
      localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(SEED_INTERVIEWS));
    }
    if (!localStorage.getItem(QUESTIONS_KEY)) {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(SEED_QUESTIONS));
    }
    if (!localStorage.getItem(REPORTS_KEY)) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify([SEED_REPORT]));
    }
  },

  getProfile(): UserProfile {
    this.initialize();
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  },

  updateProfile(profile: UserProfile): UserProfile {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
  },

  getResumes(): ResumeData[] {
    this.initialize();
    return JSON.parse(localStorage.getItem(RESUMES_KEY) || "[]");
  },

  getResumeById(id: string): ResumeData | undefined {
    return this.getResumes().find(r => r.id === id);
  },

  addResume(resume: ResumeData): ResumeData {
    const resumes = this.getResumes();
    resumes.unshift(resume);
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
    return resume;
  },

  deleteResume(id: string) {
    const resumes = this.getResumes().filter(r => r.id !== id);
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes));
  },

  getInterviews(): Interview[] {
    this.initialize();
    return JSON.parse(localStorage.getItem(INTERVIEWS_KEY) || "[]");
  },

  getInterviewById(id: string): Interview | undefined {
    return this.getInterviews().find(i => i.id === id);
  },

  createInterview(interview: Interview): Interview {
    const interviews = this.getInterviews();
    interviews.unshift(interview);
    localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(interviews));
    return interview;
  },

  updateInterview(interview: Interview): Interview {
    const interviews = this.getInterviews().map(i => i.id === interview.id ? interview : i);
    localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(interviews));
    return interview;
  },

  deleteInterview(id: string) {
    const interviews = this.getInterviews().filter(i => i.id !== id);
    localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(interviews));
    
    // Clean associated questions and reports
    const questions = this.getAllQuestions().filter(q => q.interview_id !== id);
    const reports = this.getAllReports().filter(r => r.interview_id !== id);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  },

  getQuestions(interview_id: string): InterviewQuestion[] {
    this.initialize();
    const all = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || "[]");
    return all.filter((q: any) => q.interview_id === interview_id);
  },

  getAllQuestions(): InterviewQuestion[] {
    this.initialize();
    return JSON.parse(localStorage.getItem(QUESTIONS_KEY) || "[]");
  },

  saveQuestions(questions: InterviewQuestion[]) {
    const all = this.getAllQuestions();
    const mapped = all.filter(q => q.interview_id !== (questions[0]?.interview_id || ""));
    const updated = [...mapped, ...questions];
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(updated));
  },

  getReportByInterviewId(interview_id: string): InterviewReport | undefined {
    return this.getAllReports().find(r => r.interview_id === interview_id);
  },

  getAllReports(): InterviewReport[] {
    this.initialize();
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
  },

  saveReport(report: InterviewReport): InterviewReport {
    const reports = this.getAllReports().filter(r => r.interview_id !== report.interview_id);
    reports.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    return report;
  }
};
