"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, GraduationCap } from "lucide-react";
import {
  educationSchema,
  type EducationInput,
} from "@/lib/validations/onboarding";

interface Props {
  defaultValues: EducationInput | null;
  onComplete: (data: EducationInput) => void;
  onBack: () => void;
}

const CLASS_LEVELS = [
  { value: "SS1", label: "SS1", desc: "Starting early — smart move" },
  { value: "SS2", label: "SS2", desc: "Getting ready ahead of time" },
  { value: "SS3", label: "SS3", desc: "The main event year" },
  { value: "GRADUATE", label: "Graduate", desc: "Retaking or improving" },
  { value: "GAP_YEAR", label: "Gap Year", desc: "Focused prep mode" },
];

const SCHOOL_TYPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
  { value: "FEDERAL_GOVERNMENT", label: "Federal Government" },
  { value: "STATE_GOVERNMENT", label: "State Government" },
  { value: "INTERNATIONAL", label: "International" },
  { value: "HOME_SCHOOL", label: "Home School" },
];

export function StepEducation({ defaultValues, onComplete, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: defaultValues || {},
  });

  const selectedLevel = watch("classLevel");

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-accent-green" />
          Education
        </h2>
        <p className="text-sm text-white/40 mt-1">
          This helps us calibrate difficulty and pacing
        </p>
      </div>

      {/* Class Level - Card Selection */}
      <div>
        <label className="label">What class are you in?</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CLASS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setValue("classLevel", level.value as any)}
              className={`rounded-lg border p-3 text-left transition-all duration-200 ${
                selectedLevel === level.value
                  ? "border-accent-green bg-accent-green/10 shadow-glow"
                  : "border-surface-border bg-surface-light hover:border-surface-border/80"
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  selectedLevel === level.value
                    ? "text-accent-green"
                    : "text-white"
                }`}
              >
                {level.label}
              </span>
              <span className="block text-xs text-white/40 mt-0.5">
                {level.desc}
              </span>
            </button>
          ))}
        </div>
        {errors.classLevel && (
          <p className="error-text">{errors.classLevel.message}</p>
        )}
      </div>

      <div>
        <label className="label">School name (optional)</label>
        <input
          {...register("schoolName")}
          placeholder="e.g. King's College Lagos"
          className="input-field"
        />
      </div>

      <div>
        <label className="label">School type</label>
        <select {...register("schoolType")} className="input-field appearance-none">
          <option value="">Select type</option>
          {SCHOOL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
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