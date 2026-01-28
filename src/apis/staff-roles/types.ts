import z from "zod";
import type { PermissionResponse } from "../permissions/types";
import type { ProfileResponse } from "../self/types";

export const createStaffRoleSchema = z.object({
  name: z.string().min(1, "validation_required"),
  permissionIds: z
    .array(z.number())
    .min(1, "validation_permission_required")
    .default([]),
});

export type CreateStaffRoleInput = z.infer<typeof createStaffRoleSchema>;

export const updateStaffRoleSchema = z.object({
  name: z.string().min(1, "validation_required"),
  permissionIds: z
    .array(z.number())
    .min(1, "validation_permission_required")
    .default([]),
});

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

export interface StaffRoleResonse {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: ProfileResponse;
  updatedAt: string;
  updatedBy: ProfileResponse;
  permissions: PermissionResponse[];
}
