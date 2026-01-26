import { http } from "@/lib/http";
import type { BaseApiResponse } from "@/lib/types";
import {
  type CreateStaffRoleInput,
  type StaffRoleResonse,
  type UpdateStaffRoleInput,
} from "./types";

async function listStaffRoles() {
  const response = await http.get<BaseApiResponse<StaffRoleResonse[]>>(
    "/api/admin/staff-roles",
  );
  return response.data;
}

async function getStaffRole(id: number) {
  const response = await http.get<BaseApiResponse<StaffRoleResonse>>(
    `/api/admin/staff-roles/${id}`,
  );
  return response.data;
}

async function createStaffRole(input: CreateStaffRoleInput) {
  const response = await http.post<BaseApiResponse<StaffRoleResonse>>(
    "/api/admin/staff-roles",
    input,
  );
  return response.data;
}

async function updateStaffRole(id: number, input: UpdateStaffRoleInput) {
  const response = await http.put<BaseApiResponse<StaffRoleResonse>>(
    `/api/admin/staff-roles/${id}`,
    input,
  );
  return response.data;
}

async function copyStaffRole(id: number) {
  const response = await http.post<BaseApiResponse<StaffRoleResonse>>(
    `/api/admin/staff-roles/copy/${id}`,
  );
  return response.data;
}

export const staffRolesApi = {
  listStaffRoles,
  getStaffRole,
  createStaffRole,
  updateStaffRole,
  copyStaffRole,
} as const;
