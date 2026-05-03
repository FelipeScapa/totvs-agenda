import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { downloadBackup, importAll } from '@/lib/backup';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BackupManager({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadBackup();
    toast({ title: 'Backup baixado', description: 'Guarde o arquivo .json em local seguro.' });
  };

  const handleFile = async (file: File, mode: 'merge' | 'replace') => {
    try {
      const text = await file.text();
      const res = importAll(text, mode);
      toast({ title: 'Backup restaurado', description: `${res.imported} chaves importadas. A página será recarregada.` });
      setTimeout(() => window.location.reload(), 800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao ler o arquivo';
      toast({ title: 'Falha ao importar', description: msg, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Backup dos dados</DialogTitle>
          <DialogDescription>
            Exporte todos os dados (agenda + financeiro) num único arquivo JSON. Use a importação para restaurar em outro navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-card p-4 space-y-2">
            <h3 className="font-medium text-sm">Exportar</h3>
            <p className="text-xs text-muted-foreground">Baixa um arquivo JSON com tudo armazenado localmente.</p>
            <Button onClick={handleExport} className="gap-2 w-full" size="sm">
              <Download className="w-4 h-4" /> Baixar backup
            </Button>
          </div>

          <div className="glass-card p-4 space-y-2">
            <h3 className="font-medium text-sm flex items-center gap-2">
              Importar
              <AlertTriangle className="w-3 h-3 text-warning" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Substitui os dados atuais pelos do arquivo. Faça um export antes para garantir.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f, 'replace');
                e.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => inputRef.current?.click()}>
                <Upload className="w-4 h-4" /> Restaurar (substitui)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
