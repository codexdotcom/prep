"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  BookOpen,
  Eye,
  PenTool,
  Shuffle,
} from "lucide-react";
import {
  studyPreferencesSchema,
  type StudyPreferencesInput,
} from "@/lib/validations/onboarding";

interface Props {
  defaultValues: StudyPreferencesInput | null;
  onComplete: (data: StudyPreferencesInput) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const TIME_SLOTS = [
  { value: "EARLY_MORNING", label: "5–8 AM", icon: Sunrise, desc: "Early bird" },
  { value: "MORNING", label: "8 AM–12 PM", icon: Sun, desc: "Morning person" },
  { value: "AFTERNOON", label: "12–4 PM", icon: Sun, desc: "Afternoon focus" },
  { value: "EVENING", label: "4–8 PM", icon: Sunset, desc: "Evening grinder" },
  { value: "NIGHT", label: "8 PM–12 AM", icon: Moon, desc: "Night owl" },
  { value: "LATE_NIGHT", label: "12–5 AM", icon: Moon, desc: "Midnight scholar" },
];

const LEARNING_STYLES = [
  {
    value: "VISUAL",
    label: "Visual",
    icon: Eye,
    desc: "Diagrams, charts, videos",
  },
  {
    value: "READING",
    label: "Reading",
    icon: BookOpen,
    desc: "Notes, textbooks, articles",
  },
  {
    value: "PRACTICE",
    label: "Practice",
    icon: PenTool,
    desc: "Questions, tests, drills",
  },
  {
    value: "MIXED",
    label: "Mixed",
    icon: Shuffle,
    desc: "A bit of everything",
  },
];

export function StepStudyPrefs({
  defaultValues,
  onComplete,
  onBack,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudyPreferencesInput>({
    resolver: zodResolver(studyPreferencesSchema),
    defaultValues: defaultValues || {
      studyHoursPerDay: 2,
      preferredTimeSlot: "EVENING",
      learningStyle: "MIXED",
    },
  });

  const selectedTime = watch("preferredTimeSlot");
  const selectedStyle = watch("learningStyle");
  const hours = watch("studyHoursPerDay");

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent-green" />
          Study Preferences
        </h2>
        <p className="text-sm text-white/40 mt-1">
          We'll build your daily plan around these
        </p>
      </div>

      {/* Study Hours Slider */}
      <div>
        <label className="label">
          Hours per day:{" "}
          <span className="text-accent-green font-semibold">{hours}h</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={hours}
          onChange={(e) =>
            setValue("studyHoursPerDay", parseFloat(e.target.value))
          }
          className="w-full h-2 bg-surface-lighter rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-accent-green [&::-webkit-slider-thumb]:shadow-glow
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-white/20 mt-1">
          <span>30 min</span>
          <span>8 hours</span>
        </div>
      </div>

      {/* Preferred Time */}
      <div>
        <label className="label">Best time to study</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const isSelected = selectedTime === slot.value;

            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => setValue("preferredTimeSlot", slot.value as any)}
                className={`rounded-lg border p-2.5 text-center transition-all duration-200 ${
                  isSelected
                    ? "border-accent-green bg-accent-green/10 shadow-glow"
                    : "border-surface-border bg-surface-light hover:border-surface-border/80"
                }`}
              >
                <Icon
                  className={`h-4 w-4 mx-auto mb-1 ${
                    isSelected ? "text-accent-green" : "text-white/40"
                  }`}
                />
                <span
                  className={`block text-xs font-semibold ${
                    isSelected ? "text-accent-green" : "text-white/70"
                  }`}
                >
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Learning Style */}
      <div>
        <label className="label">How do you learn best?</label>
        <div className="grid grid-cols-2 gap-2">
          {LEARNING_STYLES.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyle === style.value;

            return (
              <button
                key={style.value}
                type="button"
                onClick={() => setValue("learningStyle", style.value as any)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-accent-green bg-accent-green/10 shadow-glow"
                    : "border-surface-border bg-surface-light hover:border-surface-border/80"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isSelected ? "text-accent-green" : "text-white/40"
                  }`}
                />
                <div>
                  <span
                    className={`block text-sm font-semibold ${
                      isSelected ? "text-accent-green" : "text-white"
                    }`}
                  >
                    {style.label}
                  </span>
                  <span className="block text-xs text-white/40">
                    {style.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex flex-1 items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Start Diagnostic Test
            </>
          )}
        </button>
      </div>
    </form>
  );
}