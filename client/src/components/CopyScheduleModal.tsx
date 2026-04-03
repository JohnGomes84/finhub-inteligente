import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";

interface CopyScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: number;
  onCopySuccess: (newScheduleId: number) => void;
  onCopy: (scheduleId: number, newDate: string) => Promise<{ id: number }>;
}

export function CopyScheduleModal({
  open,
  onOpenChange,
  scheduleId,
  onCopySuccess,
  onCopy,
}: CopyScheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    if (!newDate) {
      toast.error("Selecione uma data de destino");
      return;
    }

    setIsLoading(true);
    try {
      const result = await onCopy(scheduleId, newDate);
      toast.success("Planejamento copiado com sucesso!");
      onCopySuccess(result.id);
      onOpenChange(false);
      setNewDate("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao copiar planejamento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Copiar Planejamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="copy-date">Data de Destino</Label>
            <Input
              id="copy-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Serão copiados: cliente, turno, local e funções com valores padrão.
              Diaristas NÃO serão copiados.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCopy} disabled={isLoading || !newDate}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
