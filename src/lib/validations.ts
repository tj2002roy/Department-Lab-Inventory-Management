import { z } from "zod";

export const CreateItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  category: z.string().min(2, "Category is required"),
  labId: z.string().uuid("Invalid Lab ID"),
  systemId: z.string().uuid("Invalid System ID").optional().nullable(),
  attributes: z.record(z.any()).default({}),
  userId: z.string().uuid("User ID required for audit trail"),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.string().min(2).optional(),
  systemId: z.string().uuid().optional().nullable(),
  attributes: z.record(z.any()).optional(),
  userId: z.string().uuid("User ID required for audit trail"),
  comment: z.string().optional(),
});

export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

export const CreateSystemSchema = z.object({
  name: z.string().min(2, "System name must be at least 2 characters"),
  labId: z.string().uuid("Invalid Lab ID"),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED"]).default("OPERATIONAL"),
  itemIds: z.array(z.string().uuid()).default([]),
  userId: z.string().uuid("User ID required for audit trail"),
});

export type CreateSystemInput = z.infer<typeof CreateSystemSchema>;

export const RelocateItemSchema = z.object({
  itemId: z.string().uuid("Invalid Item ID"),
  toLabId: z.string().uuid("Invalid destination Lab ID"),
  userId: z.string().uuid().optional(),
  comment: z.string().optional(),
  detachFromSystem: z.boolean().default(false), // if item belongs to a system, optionally detach it
});

export type RelocateItemInput = z.infer<typeof RelocateItemSchema> & { userId: string };

export const RelocateSystemSchema = z.object({
  systemId: z.string().uuid("Invalid System ID"),
  toLabId: z.string().uuid("Invalid destination Lab ID"),
  userId: z.string().uuid().optional(),
  comment: z.string().optional(),
});

export type RelocateSystemInput = z.infer<typeof RelocateSystemSchema> & { userId: string };

export const AddCommentSchema = z.object({
  itemId: z.string().uuid("Invalid Item ID").optional().nullable(),
  systemId: z.string().uuid("Invalid System ID").optional().nullable(),
  userId: z.string().uuid().optional(),
  commentText: z.string().min(1, "Comment text cannot be empty").max(2000).optional(),
  comment_text: z.string().min(1, "Comment text cannot be empty").max(2000).optional(),
}).refine(data => data.itemId || data.systemId, {
  message: "Comment must be attached to either an Item or a System",
}).refine(data => !!(data.commentText || data.comment_text), {
  message: "Comment text cannot be empty",
});

export type AddCommentInput = {
  itemId?: string | null;
  systemId?: string | null;
  userId: string;
  commentText: string;
};
