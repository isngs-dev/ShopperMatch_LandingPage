import { z } from "zod";

/** Shared by the contact form (client) and /api/demo-request (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().min(1, "Company Name is required").max(160),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "Phone Number is required")
    .refine(
      (v) => /^[+()\-.\s\d]+$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15,
      "Enter a valid phone number",
    ),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const meetingSchema = z.object({
  /** Meeting start as an absolute UTC instant (ISO 8601). */
  startISO: z.string().datetime(),
  /** IANA time zone the visitor picked the slot in, e.g. "Asia/Kolkata". */
  timeZone: z.string().min(1).max(64),
});
export type MeetingChoice = z.infer<typeof meetingSchema>;

export const demoRequestSchema = contactSchema.extend({
  /** null = visitor chose "No, thanks, just email me". */
  meeting: meetingSchema.nullable(),
});
export type DemoRequest = z.infer<typeof demoRequestSchema>;

export const MEETING_MINUTES = 30;
