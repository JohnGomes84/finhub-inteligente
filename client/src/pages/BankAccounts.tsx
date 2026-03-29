import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import CrudPage, { type FieldDef } from "@/components/CrudPage";
import { Landmark } from "lucide-react";

const fields: FieldDef[] = [
  { key: "name", label: "Nome da Conta", required: true },
  { key: "bankName", label: "Banco" },
  { key: "agency", label: "Agência" },
  { key: "accountNumber", label: "Número da Conta" },
  { key: "accountType", label: "Tipo", type: "select", options: [
    { value: "checking", label: "Corrente" },
    { value: "savings", label: "Poupança" },
    { value: "investment", label: "Investimento" },
  ], render: (val: string) => {
    const labels: Record<string, string> = { checking: "Corrente", savings: "Poupança", investment: "Investimento" };
    return labels[val] || val;
  }},
  { key: "currentBalance", label: "Saldo Atual (R$)", render: (val: string) => {
    const num = parseFloat(val || "0");
    return <span className={num >= 0 ? "text-emerald-400" : "text-red-400"}>
      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)}
    </span>;
  }},
  { key: "initialBalance", label: "Saldo Inicial (R$)", showInTable: false },
];

export default function BankAccountsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.cadastros.bankAccounts.list.useQuery();
  const createMut = trpc.cadastros.bankAccounts.create.useMutation({ onSuccess: () => utils.cadastros.bankAccounts.list.invalidate() });
  const updateMut = trpc.cadastros.bankAccounts.update.useMutation({ onSuccess: () => utils.cadastros.bankAccounts.list.invalidate() });
  const deleteMut = trpc.cadastros.bankAccounts.delete.useMutation({ onSuccess: () => utils.cadastros.bankAccounts.list.invalidate() });

  return (
    <CrudPage
      title="Contas Bancárias"
      subtitle="Contas da empresa para movimentação financeira"
      icon={<Landmark className="h-6 w-6 text-primary" />}
      fields={fields}
      data={data || []}
      isLoading={isLoading}
      canCreate={canCreate("bank_accounts")}
      canEdit={canEdit("bank_accounts")}
      canDelete={canDelete("bank_accounts")}
      onCreate={async (d) => { await createMut.mutateAsync(d); }}
      onUpdate={async (d) => { await updateMut.mutateAsync(d); }}
      onDelete={async (id) => { await deleteMut.mutateAsync(id); }}
    />
  );
}
