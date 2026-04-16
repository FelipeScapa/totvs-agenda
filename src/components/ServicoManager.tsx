import { useState } from 'react';
import { useServicos } from '@/hooks/use-servicos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus } from 'lucide-react';

interface ServicoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServicoManager({ open, onOpenChange }: ServicoManagerProps) {
  const { servicos, adicionar, remover } = useServicos();
  const [nome, setNome] = useState('');
  const [valorHora, setValorHora] = useState('');

  const handleAdd = () => {
    const n = nome.trim();
    const v = parseFloat(valorHora);
    if (!n || isNaN(v) || v <= 0) return;
    adicionar(n, v);
    setNome('');
    setValorHora('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle>Cadastro de Serviços</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: TOTVS" />
            </div>
            <div className="w-24">
              <Label className="text-xs">R$/hora</Label>
              <Input type="number" value={valorHora} onChange={e => setValorHora(e.target.value)} placeholder="26" />
            </div>
            <Button onClick={handleAdd} size="icon" className="mt-5 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {servicos.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div>
                  <span className="text-sm font-medium">{s.nome}</span>
                  <span className="text-xs text-muted-foreground ml-2">R$ {s.valor_hora.toFixed(2)}/h</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remover(s.id)} className="hover:text-destructive h-7 w-7 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            {servicos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço cadastrado.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
