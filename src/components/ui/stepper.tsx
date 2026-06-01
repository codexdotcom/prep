"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "rgb(34, 197, 94)"
                    : isCurrent
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  borderColor: isCompleted || isCurrent
                    ? "rgb(34, 197, 94)"
                    : "rgba(255, 255, 255, 0.1)",
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors"
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-surface" />
                ) : (
                  <span
                    className={`text-sm font-mono font-semibold ${
                      isCurrent ? "text-accent-green" : "text-white/30"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isCurrent
                    ? "text-accent-green"
                    : isCompleted
                    ? "text-white/60"
                    : "text-white/20"
                }`}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="mx-2 mt-[-1.25rem] h-[2px] w-12 sm:w-20">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted
                      ? "rgb(34, 197, 94)"
                      : "rgba(255, 255, 255, 0.1)",
                  }}
                  className="h-full w-full rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}