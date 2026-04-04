import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", employees: "Funcionários", clients: "Clientes",
  suppliers: "Fornecedores", shifts: "Turnos", functions: "Funções",
  cost_centers: "Centros de Custo", bank_accounts: "Contas Bancárias",
  accounts_payable: "Contas a Pagar", accounts_receivable: "Contas a Receber",
  payment_batches: "Lotes de Pagamento", schedules: "Planejamentos",
  documents: "Documentos",
  analytics: "Analytics", users: "Usuários",
};

const ACTIONS = ["canView", "canCreate", "canEdit", "canDelete"] as const;
const ACTION_LABELS: Record<string, string> = {
  canView: "Ver", canCreate: "Criar", canEdit: "Editar", canDelete: "Excluir",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: usersList, isLoading } = trpc.usuarios.list.useQuery();
  const setPermMut = trpc.usuarios.setModulePermission.useMutation();
  const setRoleMut = trpc.usuarios.setRole.useMutation();
  const utils = trpc.useUtils();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Apenas administradores podem acessar esta página</p>
        </div>
      </div>
    );
  }

  const handleTogglePermission = async (userId: number, module: string, action: string, currentPerms: any) => {
    const newValue = !currentPerms[action];
    try {
      await setPermMut.mutateAsync({
        userId,
        module,
        canView: action === "canView" ? newValue : (currentPerms.canView ?? false),
        canCreate: action === "canCreate" ? newValue : (currentPerms.canCreate ?? false),
        canEdit: action === "canEdit" ? newValue : (currentPerms.canEdit ?? false),
        canDelete: action === "canDelete" ? newValue : (currentPerms.canDelete ?? false),
      });
      utils.usuarios.list.invalidate();
      toast.success("Permissão atualizada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar permissão");
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await setRoleMut.mutateAsync({ userId, role: newRole as "user" | "admin" });
      utils.usuarios.list.invalidate();
      toast.success(`Papel alterado para ${newRole === "admin" ? "Administrador" : "Usuário"}`);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao alterar papel");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Gestão de Usuários
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Controle de acesso granular por módulo. Admin tem acesso total automático.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {usersList?.map(user => {
            const isExpanded = expandedUser === user.id;
            const isAdmin = user.role === "admin";
            const isSelf = user.id === currentUser?.id;

            return (
              <Card key={user.id} className="border-border/50">
                <CardContent className="p-0">
                  {/* User Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isAdmin ? "badge-success" : "badge-info"}`}>
                        {isAdmin ? "Admin" : "Usuário"}
                      </span>
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => { e.stopPropagation(); handleToggleRole(user.id, user.role); }}
                        >
                          {isAdmin ? "Rebaixar" : "Promover"}
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  {isExpanded && !isAdmin && (
                    <div className="border-t border-border/50 p-4">
                      <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                        Permissões por Módulo
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Módulo</th>
                              {ACTIONS.map(a => (
                                <th key={a} className="text-center py-2 px-2 text-xs font-semibold text-muted-foreground">
                                  {ACTION_LABELS[a]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(MODULE_LABELS).map(([mod, label]) => {
                              const perms = (user as any).permissions?.[mod] || { canView: false, canCreate: false, canEdit: false, canDelete: false };
                              return (
                                <tr key={mod} className="border-b border-border/20 hover:bg-accent/20">
                                  <td className="py-2 pr-4 text-xs">{label}</td>
                                  {ACTIONS.map(action => (
                                    <td key={action} className="text-center py-2 px-2">
                                      <Switch
                                        checked={perms[action] || false}
                                        onCheckedChange={() => handleTogglePermission(user.id, mod, action, perms)}
                                        className="scale-75"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {isExpanded && isAdmin && (
                    <div className="border-t border-border/50 p-4">
                      <p className="text-sm text-emerald-400 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administradores têm acesso total a todos os módulos automaticamente.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
