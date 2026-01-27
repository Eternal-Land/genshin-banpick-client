import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffsApi } from "@/apis/staffs";
import { staffRolesApi } from "@/apis/staff-roles";
import { updateStaffSchema, type UpdateStaffInput } from "@/apis/staffs/types";
import type { StaffRoleResonse } from "@/apis/staff-roles/types";
import type { BaseApiResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/staffs/$staffId")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { staffId } = Route.useParams();

  type UpdateStaffFormInput = z.input<typeof updateStaffSchema>;
  const form = useForm<UpdateStaffFormInput>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      email: "",
      displayName: "",
      ingameUuid: "",
      staffRoleId: undefined,
    },
  });

  const {
    data: staffResponse,
    isLoading: isStaffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: () => staffsApi.getStaff(staffId),
    enabled: Boolean(staffId),
  });

  const { data: staffRolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesApi.listStaffRoles,
  });

  const staffRoles = staffRolesResponse?.data ?? [];

  useEffect(() => {
    const staff = staffResponse?.data;
    if (!staff) return;

    form.reset({
      email: staff.email,
      displayName: staff.displayName,
      ingameUuid: staff.ingameUuid ?? "",
      staffRoleId: staff.staffRoleId,
    });

    form.setValue("staffRoleId", staff.staffRoleId);
  }, [form, staffResponse, staffRolesResponse]);

  const updateMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    UpdateStaffInput
  >({
    mutationFn: (values) => staffsApi.updateStaff(staffId, values),
    onSuccess: () => {
      toast.success("Staff updated successfully.");
      navigate({ to: "/admin/staffs" });
    },
  });

  const staffRoleCount = useMemo(() => staffRoles.length, [staffRoles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit staff</CardTitle>
        <CardDescription className="space-y-1">
          <span>Update profile details and assigned role.</span>
          <span className="text-xs">
            {staffRoleCount} role{staffRoleCount === 1 ? "" : "s"} available
          </span>
          {staffError ? (
            <span className="text-destructive">
              Failed to load staff details.
            </span>
          ) : null}
          {updateMutation.isError && (
            <span className="text-destructive">
              {updateMutation.error.response?.data.message ||
                "Unable to update staff."}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="staff-update-form"
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate({
              email: values.email,
              displayName: values.displayName,
              ingameUuid: values.ingameUuid || undefined,
              staffRoleId: values.staffRoleId,
            }),
          )}
        >
          <FieldGroup>
            <Controller
              name="displayName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                  {isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Lumine Admin"
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  {isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="staff@example.com"
                      type="email"
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="ingameUuid"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>In-game UID</FieldLabel>
                  {isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Optional"
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="staffRoleId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="staff-role-select">
                    Staff role
                  </FieldLabel>
                  <FieldDescription>
                    Choose a role to apply permissions.
                  </FieldDescription>
                  {isRolesLoading || isStaffLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      name={field.name}
                      value={
                        field.value != undefined ? String(field.value) : ""
                      }
                      onValueChange={(values) =>
                        field.onChange(values ? Number(values) : field.value)
                      }
                    >
                      <SelectTrigger
                        id="staff-role-select"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffRoles.map((role: StaffRoleResonse) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/staffs" })}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="staff-update-form"
          disabled={updateMutation.isPending || isStaffLoading}
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
