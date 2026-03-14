"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  bank_name: z.string().min(2, {
    message: "El nombre del banco es requerido.",
  }),
  account_number: z.string().min(10, {
    message: "El número de cuenta debe tener al menos 10 dígitos.",
  }),
  clabe: z.string().length(18, {
    message: "La CLABE debe tener exactamente 18 dígitos.",
  }),
  business_name: z.string().optional(),
  rfc: z.string().optional(),
});

export const BankingInfoForm = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank_name: "",
      account_number: "",
      clabe: "",
      business_name: "",
      rfc: "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const fetchBankingInfo = async () => {
      try {
        const response = await fetch("/api/instructor/banking-info");
        const data = await response.json();
        
        if (data) {
          form.reset({
            bank_name: data.bank_name || "",
            account_number: data.account_number || "",
            clabe: data.clabe || "",
            business_name: data.business_name || "",
            rfc: data.rfc || "",
          });
          setIsEditing(false); // If there's data, default to view mode
        } else {
          setIsEditing(true); // If no data, open edit mode by default
        }
      } catch (error) {
        toast.error("Algo salió mal al cargar tu información bancaria.");
        setIsEditing(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankingInfo();
  }, [form]);

  const toggleEdit = () => setIsEditing((current) => !current);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/instructor/banking-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      toast.success("Información bancaria actualizada");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Ocurrió un error al guardar tu información.");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Landmark className="h-5 w-5 text-blue-600" />
              Información Bancaria
            </CardTitle>
            <CardDescription className="text-gray-600">
              Proporciona los datos donde recibirás tus pagos mensuales.
            </CardDescription>
          </div>
          <Button onClick={toggleEdit} variant="outline" type="button">
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Banco</p>
                <p className="text-base text-gray-900">{form.getValues("bank_name") || "No configurado"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">CLABE Interbancaria</p>
                <p className="text-base font-mono text-gray-900">
                  {form.getValues("clabe") ? `**** **** **** ${form.getValues("clabe").slice(-4)}` : "No configurado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Cuenta</p>
                <p className="text-base font-mono text-gray-900">
                  {form.getValues("account_number") ? `**** ${form.getValues("account_number").slice(-4)}` : "No configurado"}
                </p>
              </div>
            </div>
            {(form.getValues("business_name") || form.getValues("rfc")) && (
              <>
                <div className="border-t border-blue-100 my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.getValues("business_name") && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Razón Social</p>
                      <p className="text-base text-gray-900">{form.getValues("business_name")}</p>
                    </div>
                  )}
                  {form.getValues("rfc") && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">RFC</p>
                      <p className="text-base text-gray-900">{form.getValues("rfc")}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {isEditing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Nombre del Banco</FormLabel>
                    <FormControl>
                      <Input disabled={isSubmitting} placeholder="Ej. BBVA, Santander, Nu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clabe"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>CLABE (18 dígitos)</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="123456789012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Número de Cuenta</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t border-blue-100 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Información Fiscal (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Razón Social / Nombre Completo</FormLabel>
                        <FormControl>
                          <Input disabled={isSubmitting} placeholder="Ej. Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rfc"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>RFC</FormLabel>
                        <FormControl>
                          <Input disabled={isSubmitting} placeholder="PEJU800101XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-x-2 pt-4">
                <Button disabled={isSubmitting} type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar Información
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};
