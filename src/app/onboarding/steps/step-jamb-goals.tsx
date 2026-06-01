"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, Target, Check } from "lucide-react";
import {
  jambGoalsSchema,
  type JambGoalsInput,
} from "@/lib/validations/onboarding";
import { JAMB_SUBJECTS, POPULAR_UNIVERSITIES } from "@/lib/data/nigerian-states";
import { useState } from "react";

interface Props {
  defaultValues: JambGoalsInput | null;
  onComplete: (data: JambGoalsInput) => void;
  onBack: () => void;
}

const SCORE_TARGETS = [
  { value: 200, label: "200+", color: "text-yellow-400", desc: "Solid start" },
  { value: 250, label: "250+", color: "text-accent-green", desc: "Competitive" },
  { value: 300, label: "300+", color: "text-blue-400", desc: "Top tier" },
  { value: 350, label: "350+", color: "text-purple-400", desc: "Elite" },
];

export function StepJambGoals({ defaultValues, onComplete, onBack }: Props) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    defaultValues?.subjects || []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<JambGoalsInput>({
    resolver: zodResolver(jambGoalsSchema),
    defaultValues: defaultValues || {
      examYear: new Date().getFullYear() + 1,
      targetScore: 250,
      subjects: [],
    },
  });

  const targetScore = watch("targetScore");

  const toggleSubject = (subjectValue: string) => {
    setSelectedSubjects((prev) => {
      const next = prev.includes(subjectValue)
        ? prev.filter((s) => s !== subjectValue)
        : prev.length < 3
        ? [...prev, subjectValue]
        : prev;

      setValue("subjects", next);
      return next;
    });
  };

  // Group subjects by category
  const grouped = JAMB_SUBJECTS.reduce((acc, sub) => {
    if (!acc[sub.category]) acc[sub.category] = [];
    acc[sub.category].push(sub);
    return acc;
  }, {} as Record<string, typeof JAMB_SUBJECTS>);

  const categoryLabels: Record<string, string> = {
    science: "Sciences",
    social_science: "Social Sciences",
    arts: "Arts & Humanities",
    languages: "Languages",
  };

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-accent-green" />
          JAMB Goals
        </h2>
        <p className="text-sm text-white/40 mt-1">
          This is the core of your personalized plan
        </p>
      </div>

      {/* Exam Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Exam year</label>
          <select
            {...register("examYear", { valueAsNumber: true })}
            className="input-field appearance-none"
          >
            {[2025, 2026, 2027, 2028].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Previous JAMB score</label>
          <input
            {...register("previousJambScore", { valueAsNumber: true })}
            type="number"
            placeholder="Leave blank if first time"
            className="input-field"
            min={0}
            max={400}
          />
        </div>
      </div>

      {/* Target Score */}
      <div>
        <label className="label">Target score</label>
        <div className="grid grid-cols-4 gap-2">
          {SCORE_TARGETS.map((target) => (
            <button
              key={target.value}
              type="button"
              onClick={() => setValue("targetScore", target.value)}
              className={`rounded-lg border p-3 text-center transition-all duration-200 ${
                targetScore === target.value
                  ? "border-accent-green bg-accent-green/10 shadow-glow"
                  : "border-surface-border bg-surface-light hover:border-surface-border/80"
              }`}
            >
              <span className={`block text-lg font-bold ${target.color}`}>
                {target.label}
              </span>
              <span className="block text-xs text-white/40">{target.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject Selection */}
      <div>
        <label className="label">
          Choose 3 subjects{" "}
          <span className="text-white/30">
            (Use of English is automatic)
          </span>
        </label>
        <div className="text-xs text-accent-green mb-2">
          {selectedSubjects.length}/3 selected
        </div>

        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([category, subjects]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1.5">
                {categoryLabels[category] || category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(subjects as typeof JAMB_SUBJECTS).map((subject) => {
                  const isSelected = selectedSubjects.includes(subject.value);
                  const isDisabled =
                    !isSelected && selectedSubjects.length >= 3;

                  return (
                    <button
                      key={subject.value}
                      type="button"
                      onClick={() => toggleSubject(subject.value)}
                      disabled={isDisabled}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-accent-green text-surface border border-accent-green"
                          : isDisabled
                          ? "border border-surface-border bg-surface text-white/20 cursor-not-allowed"
                          : "border border-surface-border bg-surface-light text-white/60 hover:border-accent-green/50 hover:text-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {subject.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {errors.subjects && (
          <p className="error-text">{errors.subjects.message}</p>
        )}
      </div>

      {/* University / Course */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Preferred university</label>
          <select
            {...register("preferredUni")}
            className="input-field appearance-none text-sm"
          >
            <option value="">Select university</option>
            {POPULAR_UNIVERSITIES.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Desired course</label>
          <input
            {...register("preferredCourse")}
            placeholder="e.g. Medicine"
            className="input-field"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button type="submit" className="btn-primary flex flex-1 items-center justify-center gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}