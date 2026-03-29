import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import CrudPage, { type FieldDef } from "@/components/CrudPage";
import { CreditCard } from "lucide-react";

const statusRender = (val: string) => {
  const styles: Record<string, string> = {
    pendente: "badge-warning", pago: "badge-success", vencido: "badge-danger", cancelado: "badge-info",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[val] || ""}`}>{val || "—"}</span>;
};

const currencyRender = (val: string) => {
  const num = parseFloat(val || "0");
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
};

const fields: FieldDef[] = [
  { key: "description", label: "Descrição", required: true },
  { key: "amount", label: "Valor (R$)", required: true, render: currencyRender },
  { key: "dueDate", label: "Vencimento", type: "date", required: true, render: (val: any) => val ? new Date(val).toLocaleDateString("pt-BR") : "—" },
  { key: "status", label: "Status", type: "select", options: [
    { value: "pendente", label: "Pendente" },
    { value: "pago", label: "Pago" },
    { value: "vencido", label: "Vencido" },
    { value: "cancelado", label: "Cancelado" },
  ], render: statusRender },
  { key: "paymentDate", label: "Data Pagamento", type: "date", showInTable: false },
  { key: "notes", label: "Observações", type: "textarea", showInTable: false },
];

export default function AccountsPayablePage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.financeiro.payable.list.useQuery();
  const createMut = trpc.financeiro.payable.create.useMutation({ onSuccess: () => { utils.financeiro.payable.list.invalidate(); utils.financeiro.payable.summary.invalidate(); } });
  const updateMut = trpc.financeiro.payable.update.useMutation({ onSuccess: () => { utils.financeiro.payable.list.invalidate(); utils.financeiro.payable.summary.invalidate(); } });
  const deleteMut = trpc.financeiro.payable.delete.useMutation({ onSuccess: () => { utils.financeiro.payable.list.invalidate(); utils.financeiro.payable.summary.invalidate(); } });

  return (
    <CrudPage
      title="Contas a Pagar"
      subtitle="Despesas e obrigações financeiras"
      icon={<CreditCard className="h-6 w-6 text-red-400" />}
      fields={fields}
      data={data || []}
      isLoading={isLoading}
      canCreate={canCreate("accounts_payable")}
      canEdit={canEdit("accounts_payable")}
      canDelete={canDelete("accounts_payable")}
      onCreate={async (d) => { await createMut.mutateAsync(d); }}
      onUpdate={async (d) => { await updateMut.mutateAsync(d); }}
      onDelete={async (id) => { await deleteMut.mutateAsync(id); }}
      searchPlaceholder="Buscar por descrição..."
    />
  );
}
