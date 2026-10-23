import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid mobile number");

export const providerCategorySchema = z.enum([
  "district_hospital",
  "phc",
  "mobile_camp",
  "ngo_camp",
]);

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "OTP must contain 6 digits"),
});

const providerDetailsSchema = z.object({
  category: providerCategorySchema,
  fullName: z.string().trim().min(2).max(120),
  designation: z.string().trim().min(2).max(120),
  facilityId: z.string().trim().min(2).max(120),
  facilityProofUrl: z.string().trim().url().optional(),
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  consent: z.literal(true, { error: "Consent is required" }),
});

const providerConditionSchema = z.object({
  condition: z.string().trim().min(2).max(2000),
  conditionDateTime: z.coerce.date(),
  conditionStartDateTime: z.coerce.date().optional(),
  conditionEndDateTime: z.coerce.date().optional(),
}).refine(
  (data) =>
    !data.conditionStartDateTime ||
    !data.conditionEndDateTime ||
    data.conditionEndDateTime >= data.conditionStartDateTime,
  {
    message: "Condition end date/time must be after the start date/time",
    path: ["conditionEndDateTime"],
  },
);

export const providerRegistrationSchema = providerDetailsSchema.extend({
  phone: phoneSchema,
});

export const providerUpdateSchema = providerDetailsSchema
  .partial()
  .merge(providerConditionSchema.partial())
  .refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one provider field is required" },
);

export const workerRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  yearOfBirth: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  gender: z.enum(["male", "female", "other"]),
  industry: z.string().trim().min(2).max(120),
  homeState: z.string().trim().min(2).max(80),
  homeDistrict: z.string().trim().min(2).max(80),
  workDestination: z.string().trim().min(2).max(160),
  consent: z.literal(true, { error: "Consent is required" }),
});

export const workerLoginSchema = z.object({
  workerId: z.string().trim().min(4).max(40),
});
