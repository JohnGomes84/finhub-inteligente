import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportExcelProps {
  title: string;
  templateColumns: { key: string; label: string; type?: string }[];
  onImport: (data: any[]) => Promise<{ success: number; errors: { row: number; error: string }[] }>;
  fileName?: string;
}

export function ImportExcel({ title, templateColumns, onImport, fileName = "template" }: ImportExcelProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: { row: number; error: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(
      [Object.fromEntries(templateColumns.map((col) => [col.label, `Exemplo: ${col.key}`]))],
      { header: templateColumns.map((col) => col.label) }
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${fileName}_template.xlsx`);
    toast.success("Template baixado!");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        toast.error("Planilha vazia!");
        setImporting(false);
        return;
      }

      // Mapear colunas do template
      const mappedData = data.map((row: any, idx: number) => {
        const mapped: any = {};
        let hasError = false;
        const errors: string[] = [];

        for (const col of templateColumns) {
          const value = row[col.label];
          if (!value && col.key !== "notes") {
            errors.push(`Campo obrigatório: ${col.label}`);
            hasError = true;
          }
          mapped[col.key] = value;
        }

        return { ...mapped, _rowErrors: errors, _hasError: hasError, _rowNumber: idx + 2 };
      });

      const result = await onImport(mappedData);
      setResults(result);
      toast.success(`Importação concluída: ${result.success} registros adicionados`);
    } catch (err: any) {
      toast.error(`Erro ao processar arquivo: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-1.5">
        <Upload className="h-4 w-4" /> Importar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>

          {!results ? (
            <div className="space-y-4">
              <div className="bg-slate-700 p-4 rounded space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Download className="h-4 w-4" />
                  <span>1. Baixe o template com as colunas corretas</span>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" /> Baixar Template
                </Button>
              </div>

              <div className="bg-slate-700 p-4 rounded space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Upload className="h-4 w-4" />
                  <span>2. Preencha os dados e faça upload</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importing}
                  className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              <div className="text-xs text-slate-400">
                <p>Colunas esperadas:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {templateColumns.map((col) => (
                    <li key={col.key}>
                      {col.label} {col.key !== "notes" && <span className="text-red-400">*</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-700/30 p-4 rounded flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-300">{results.success} registros importados com sucesso</div>
                  {results.errors.length > 0 && (
                    <div className="text-sm text-green-200 mt-1">{results.errors.length} erros encontrados</div>
                  )}
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/30 p-4 rounded space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
                    <AlertCircle className="h-4 w-4" /> Erros encontrados
                  </div>
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-red-200 bg-red-900/30 p-2 rounded">
                      <strong>Linha {err.row}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setResults(null)} variant="outline" className="flex-1">
                  Importar Novamente
                </Button>
                <Button onClick={() => setOpen(false)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
