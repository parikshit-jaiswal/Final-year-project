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

const providerConditionFields = z.object({
  condition: z.string().trim().min(2).max(2000),
  conditionDateTime: z.coerce.date(),
  conditionStartDateTime: z.coerce.date().optional(),
  conditionEndDateTime: z.coerce.date().optional(),
});

export const providerRegistrationSchema = providerDetailsSchema.extend({
  phone: phoneSchema,
});

export const providerUpdateSchema = providerDetailsSchema.partial()
  .extend(providerConditionFields.partial().shape)
  .refine(
    (data) =>
      !data.conditionStartDateTime ||
      !data.conditionEndDateTime ||
      data.conditionEndDateTime >= data.conditionStartDateTime,
    {
      message: "Condition end date/time must be after the start date/time",
      path: ["conditionEndDateTime"],
    },
  )
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

export const workerUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  yearOfBirth: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  industry: z.string().trim().min(2).max(120).optional(),
  homeState: z.string().trim().min(2).max(80).optional(),
  homeDistrict: z.string().trim().min(2).max(80).optional(),
  workDestination: z.string().trim().min(2).max(160).optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one worker field is required");

export const medicalRecordSchema = z.object({
  workerId: z.string().trim().min(4).max(40),
  condition: z.string().trim().min(2).max(2000),
  visitAt: z.coerce.date(),
  prescriptionNotes: z.string().trim().max(5000).optional(),
  clinicalRemarks: z.string().trim().max(5000).optional(),
  observations: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  accuracyMeters: z.coerce.number().min(0).optional(),
  capturedAt: z.coerce.date().optional(),
  address: z.string().trim().max(300).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const providerStatusSchema = z.object({
  status: z.enum(["active", "rejected"]),
});
