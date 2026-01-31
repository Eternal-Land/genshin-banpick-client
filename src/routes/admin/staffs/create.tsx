import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffsApi } from "@/apis/staffs";
import { createStaffSchema, type CreateStaffInput } from "@/apis/staffs/types";
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LocaleKeys } from "@/lib/constants";
import { StaffForm, type StaffFormValues } from "@/components/staffs";

export const Route = createFileRoute("/admin/staffs/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      email: "",
      displayName: "",
      ingameUuid: "",
      staffRoleId: undefined as number | undefined,
      password: "",
      avatar: undefined as string | undefined,
    },
  });

  const createMutation = useMutation<
    BaseApiResponse,
    AxiosError<BaseApiResponse>,
    CreateStaffInput
  >({
    mutationFn: staffsApi.createStaff,
    onSuccess: () => {
      toast.success(t(LocaleKeys.staffs_create_success));
      navigate({ to: "/admin/staffs" });
    },
  });

  const handleSubmit = (values: StaffFormValues) => {
    const payload: CreateStaffInput = {
      email: values.email,
      displayName: values.displayName,
      ingameUuid: values.ingameUuid || undefined,
      staffRoleId: values.staffRoleId!,
      password: values.password!,
      avatar: values.avatar || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(LocaleKeys.staffs_create_title)}</CardTitle>
        <CardDescription className="space-y-1">
          <span>{t(LocaleKeys.staffs_create_description)}</span>
          {createMutation.isError && (
            <span className="text-destructive">
              {createMutation.error.response?.data.message ||
                t(LocaleKeys.staffs_create_error)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StaffForm
          formId="staff-create-form"
          form={form}
          showPassword
          onSubmit={handleSubmit}
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/admin/staffs" })}
        >
          {t(LocaleKeys.staffs_cancel)}
        </Button>
        <Button
          type="submit"
          form="staff-create-form"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t(LocaleKeys.staffs_create_pending)
            : t(LocaleKeys.staffs_create_submit)}
        </Button>
      </CardFooter>
    </Card>
  );
}
