"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, User, MapPin } from "lucide-react";
import {
  personalInfoSchema,
  type PersonalInfoInput,
} from "@/lib/validations/onboarding";
import { NIGERIAN_STATES } from "@/lib/data/nigerian-states";

interface Props {
  defaultValues: PersonalInfoInput | null;
  onComplete: (data: PersonalInfoInput) => void;
}

export function StepPersonal({ defaultValues, onComplete }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={handleSubmit(onComplete)} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Who are you?</h2>
        <p className="text-sm text-white/40 mt-1">
          We use this to personalize your experience
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              {...register("firstName")}
              placeholder="Chidi"
              className="input-field pl-10"
            />
          </div>
          {errors.firstName && (
            <p className="error-text">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="label">Last name</label>
          <input
            {...register("lastName")}
            placeholder="Okafor"
            className="input-field"
          />
          {errors.lastName && (
            <p className="error-text">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Gender</label>
        <select {...register("gender")} className="input-field appearance-none">
          <option value="">Select gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="label">Date of birth</label>
        <input
          {...register("dateOfBirth")}
          type="date"
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">State</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <select
              {...register("state")}
              className="input-field appearance-none pl-10"
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">City</label>
          <input
            {...register("city")}
            placeholder="e.g. Ikeja"
            className="input-field"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 mt-6">
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}