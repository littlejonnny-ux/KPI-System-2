"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import type { UserProfile, SystemRole } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Schema — all fields as strings; numbers coerced in submit handler
// ---------------------------------------------------------------------------

const formSchema = z.object({
  firstName: z.string().min(1, "Обязательное поле").max(100),
  lastName: z.string().min(1, "Обязательное поле").max(100),
  middleName: z.string().max(100).optional(),
  workEmail: z.string().email("Некорректный email"),
  systemRole: z.enum(["admin", "approver", "participant"]),
  baseSalary: z.string().optional(),
  salaryMultiplier: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Output type after numeric coercion
// ---------------------------------------------------------------------------

interface SubmitOutput {
  firstName: string;
  lastName: string;
  middleName?: string;
  workEmail: string;
  systemRole: SystemRole;
  baseSalary: number | null;
  salaryMultiplier: number | null;
  password?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ParticipantFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  participant?: UserProfile;
  onSubmit: (data: SubmitOutput) => void;
  isLoading?: boolean;
  password?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParticipantFormModal({
  open,
  onClose,
  mode,
  participant,
  onSubmit,
  isLoading,
  password,
}: ParticipantFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      workEmail: "",
      systemRole: "participant",
      baseSalary: "",
      salaryMultiplier: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && participant) {
        form.reset({
          firstName: participant.firstName,
          lastName: participant.lastName,
          middleName: participant.middleName ?? "",
          workEmail: participant.workEmail,
          systemRole: participant.systemRole,
          baseSalary: participant.baseSalary?.toString() ?? "",
          salaryMultiplier: participant.salaryMultiplier?.toString() ?? "",
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          middleName: "",
          workEmail: "",
          systemRole: "participant",
          baseSalary: "",
          salaryMultiplier: "",
        });
      }
    }
  }, [open, mode, participant, form]);

  function handleSubmit(values: FormValues) {
    const parsedSalary = values.baseSalary ? parseFloat(values.baseSalary) : null;
    const parsedMultiplier = values.salaryMultiplier
      ? parseFloat(values.salaryMultiplier)
      : null;

    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      middleName: values.middleName,
      workEmail: values.workEmail,
      systemRole: values.systemRole as SystemRole,
      baseSalary: parsedSalary && !isNaN(parsedSalary) ? parsedSalary : null,
      salaryMultiplier:
        parsedMultiplier && !isNaN(parsedMultiplier) ? parsedMultiplier : null,
      password,
    });
  }

  const title = mode === "create" ? "Создать участника" : "Редактировать участника";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="sm:max-w-lg"
        data-testid="participant-form-modal"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            data-testid="participant-form"
          >
            {/* ФИО row */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Иванов"
                        data-testid="input-last-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Иван"
                        data-testid="input-first-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Отчество</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Иванович"
                        data-testid="input-middle-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email + Role */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="workEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@company.ru"
                        disabled={mode === "edit"}
                        data-testid="input-work-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as SystemRole)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-system-role">
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["participant", "approver", "admin"] as SystemRole[]).map(
                          (role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Salary */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Базовая зарплата</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="100000"
                        data-testid="input-base-salary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Мультипликатор</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        data-testid="input-salary-multiplier"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="form-cancel-btn"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="form-submit-btn"
              >
                {isLoading
                  ? "Сохранение..."
                  : mode === "create"
                    ? "Создать"
                    : "Сохранить"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
