import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/financeiro/CurrencyInput';
import { useLimitesRefeicao } from '@/hooks/use-limites-refeicao';
import { useToast } from '@/hooks/use-toast';

export function ConfiguracaoGeral({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { limites, salvar } = useLimitesRefeicao();
  const { toast } = useToast();
  const [l, setL] = useState(limites);
  useEffect(() => { if (open) setL(limites); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader><DialogTitle>Configuração Geral</DialogTitle></DialogHeader>
        <Tabs defaultValue="refeicao">
          <TabsList><TabsTrigger value="refeicao">Limites de Refeição</TabsTrigger></TabsList>
          <TabsContent value="refeicao" className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Valor máximo pago pelo cliente em cada refeição.</p>
            <div><Label>Limite Café da Manhã</Label><CurrencyInput value={l.cafe} onChange={v => setL({ ...l, cafe: v })} /></div>
            <div><Label>Limite Almoço</Label><CurrencyInput value={l.almoco} onChange={v => setL({ ...l, almoco: v })} /></div>
            <div><Label>Limite Jantar</Label><CurrencyInput value={l.jantar} onChange={v => setL({ ...l, jantar: v })} /></div>
            <Button className="w-full" onClick={() => { salvar(l); toast({ title: 'Limites salvos' }); onOpenChange(false); }}>Salvar</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
