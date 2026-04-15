import { useState } from 'react';
import { useClientes } from '@/hooks/use-clientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Users } from 'lucide-react';

interface ClienteManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteManager({ open, onOpenChange }: ClienteManagerProps) {
  const { clientes, adicionar, remover } = useClientes();
  const [novo, setNovo] = useState('');

  const handleAdd = () => {
    if (!novo.trim()) return;
    adicionar(novo);
    setNovo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Cadastro de Clientes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={novo}
              onChange={e => setNovo(e.target.value)}
              placeholder="Nome do cliente"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} className="gap-1">
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {clientes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente cadastrado.</p>
            )}
            {clientes.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/50">
                <span className="text-sm">{c.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => remover(c.id)} className="hover:text-destructive h-7 w-7 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
