"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/animated-bg";
import { Logo } from "@/components/ui/logo";
import { Stepper } from "@/components/ui/stepper";
import { StepPersonal } from "./steps/step-personal";
import { StepEducation } from "./steps/step-education";
import { StepJambGoals } from "./steps/step-jamb-goals";
import { StepStudyPrefs } from "./steps/step-study-prefs";
import type {
  PersonalInfoInput,
  EducationInput,
  JambGoalsInput,
  StudyPreferencesInput,
} from "@/lib/validations/onboarding";

const STEPS = ["Personal", "Education", "JAMB Goals", "Study Style"];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    personal: PersonalInfoInput | null;
    education: EducationInput | null;
    goals: JambGoalsInput | null;
    preferences: StudyPreferencesInput | null;
  }>({
    personal: null,
    education: null,
    goals: null,
    preferences: null,
  });

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleStepComplete = (
    step: "personal" | "education" | "goals" | "preferences",
    data: any
  ) => {
    setFormData((prev) => ({ ...prev, [step]: data }));
    if (step === "preferences") {
      handleSubmit({ ...formData, preferences: data });
    } else {
      handleNext();
    }
  };

  const handleSubmit = async (data: typeof formData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      router.push("/diagnostic");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    // Add at the end of handleSubmit, after the successful API call:
const refCode = localStorage.getItem("referralCode");
if (refCode) {
  fetch("/api/referral/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: refCode }),
  })
    .then(() => localStorage.removeItem("referralCode"))
    .catch(() => {});
}
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <AnimatedBackground />

      <div className="fixed top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-accent-green/[0.03] blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <Logo />
          <p className="mt-2 text-sm text-white/40">
            Let's set up your personalized prep plan
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Step Content */}
        <div className="card shadow-glow min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {currentStep === 0 && (
                <StepPersonal
                  defaultValues={formData.personal}
                  onComplete={(data) => handleStepComplete("personal", data)}
                />
              )}
              {currentStep === 1 && (
                <StepEducation
                  defaultValues={formData.education}
                  onComplete={(data) => handleStepComplete("education", data)}
                  onBack={handleBack}
                />
              )}
              {currentStep === 2 && (
                <StepJambGoals
                  defaultValues={formData.goals}
                  onComplete={(data) => handleStepComplete("goals", data)}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <StepStudyPrefs
                  defaultValues={formData.preferences}
                  onComplete={(data) => handleStepComplete("preferences", data)}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}