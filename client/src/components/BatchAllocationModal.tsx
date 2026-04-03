import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Users, Loader2, Search } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  cpf: string;
}

interface BatchAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onAllocate: (employeeIds: number[]) => Promise<void>;
}

export function BatchAllocationModal({
  open,
  onOpenChange,
  employees,
  onAllocate,
}: BatchAllocationModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (emp) => emp.name.toLowerCase().includes(term) || emp.cpf.includes(term)
    );
  }, [employees, searchTerm]);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAllocate = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um diarista");
      return;
    }

    setIsLoading(true);
    try {
      await onAllocate(selectedIds);
      toast.success(`${selectedIds.length} diarista(s) alocado(s) com sucesso!`);
      onOpenChange(false);
      setSelectedIds([]);
      setSearchTerm("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alocar diaristas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alocar Vários Diaristas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-64 border rounded-md p-4">
            <div className="space-y-3">
              {filteredEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum diarista encontrado
                </p>
              ) : (
                filteredEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`emp-${emp.id}`}
                      checked={selectedIds.includes(emp.id)}
                      onCheckedChange={() => handleToggle(emp.id)}
                    />
                    <Label
                      htmlFor={`emp-${emp.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.cpf}</div>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            {selectedIds.length} diarista(s) selecionado(s)
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAllocate} disabled={isLoading || selectedIds.length === 0}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Alocar {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
