import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, "Enter a valid Nigerian phone number"),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;