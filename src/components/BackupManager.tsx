import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { downloadBackup, importAll, parseBackup } from '@/lib/backup';
import { useToast } from '@/hooks/use-toast';

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export function BackupManager({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ name: string; text: string } | null>(null);
  const reportError = (error: unknown) => toast({ title: 'Operação não concluída', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });

  const handleExport = async () => {
    setBusy(true);
    try {
      const count = await downloadBackup();
      toast({ title: 'Cópia baixada', description: `${count} registros da agenda em nuvem, além dos dados financeiros deste navegador. Arquivos anexados não estão incluídos.` });
    } catch (error) { reportError(error); }
    finally { setBusy(false); }
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      parseBackup(text);
      setPending({ name: file.name, text });
    } catch (error) { reportError(error); }
    finally { setBusy(false); }
  };

  const handleImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await importAll(pending.text);
      toast({ title: 'Importação concluída', description: `${result.imported} registros processados e ${result.keys.length} conjuntos locais recuperados. Dados já existentes foram mantidos.` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) { reportError(error); setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!busy) { onOpenChange(value); setPending(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Backup dos dados</DialogTitle>
          <DialogDescription>Cópia dos registros da agenda em nuvem e do financeiro deste navegador, sem depender dos filtros.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <section className="space-y-2">
            <h3 className="font-medium text-sm">Exportar registros</h3>
            <p className="text-xs text-muted-foreground">Inclui atendimentos, clientes, serviços, tipos, pendências, férias/feriados/folgas, configurações e referências dos anexos.</p>
            <Button onClick={handleExport} disabled={busy} className="gap-2 w-full" size="sm">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {busy ? 'Aguarde…' : 'Baixar cópia dos dados'}
            </Button>
          </section>
          <p className="text-xs text-muted-foreground flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-warning" />Os arquivos anexados não estão incluídos. Baixe-os separadamente. Esta cópia não substitui a exportação completa do banco, que inclui contas de usuários.</p>
          <section className="border-t border-border pt-4 space-y-2">
            <h3 className="font-medium text-sm">Importar registros</h3>
            <p className="text-xs text-muted-foreground">Acrescenta registros ausentes. Não exclui nem substitui os dados que já existem. Aceita também o JSON antigo.</p>
            <input ref={inputRef} type="file" accept="application/json,.json" aria-label="Arquivo de backup" className="hidden" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void handleFile(file); e.target.value = ''; }} />
            {pending ? <div className="space-y-2">
              <p className="text-sm break-all">{pending.name}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImport} disabled={busy}>Confirmar importação</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setPending(null)}>Cancelar</Button>
              </div>
            </div> : <Button variant="outline" size="sm" className="gap-2 w-full" disabled={busy} onClick={() => inputRef.current?.click()}><Upload className="w-4 h-4" /> Selecionar arquivo</Button>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}