import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +14155550100");

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(1600, "Max 1600 characters");

export const peIdSchema = z
  .string()
  .trim()
  .regex(/^\d{19}$/, "PE ID must be exactly 19 digits");

export const headerSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9]{1,6}$/, "1–6 uppercase letters or digits");

export const senderIdValidators: Record<string, z.ZodString> = {
  alphanumeric: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,11}$/, "1–11 alphanumeric characters"),
  shortcode: z.string().trim().regex(/^\d{3,8}$/, "3–8 digits"),
  longcode: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "E.164 format, e.g. +14155550100"),
  tollfree: z
    .string()
    .trim()
    .regex(/^\+1(800|833|844|855|866|877|888)\d{7}$/, "US/CA toll-free, e.g. +18005551234"),
};
