import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutDashboard, Wallet, ArrowRightLeft, FileText, AlertTriangle, Settings } from 'lucide-react';
import { FinDashboard } from './FinDashboard';
import { FinContasView } from './FinContasView';
import { FinTransacoesView } from './FinTransacoesView';
import { FinFinanciamentosView } from './FinFinanciamentosView';
import { FinDividasView } from './FinDividasView';
import { FinConfiguracoes } from './FinConfiguracoes';
import { FinTipoMov } from '@/types/financeiro';

export function FinanceiroApp() {
  const [tab, setTab] = useState('dashboard');
  const [movInicial, setMovInicial] = useState<FinTipoMov | null>(null);
  const [mesInicial, setMesInicial] = useState<string | undefined>();

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="dashboard" className="gap-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
        <TabsTrigger value="contas" className="gap-1"><Wallet className="w-4 h-4" /> Contas</TabsTrigger>
        <TabsTrigger value="transacoes" className="gap-1"><ArrowRightLeft className="w-4 h-4" /> Transações</TabsTrigger>
        <TabsTrigger value="financiamentos" className="gap-1"><FileText className="w-4 h-4" /> Financiamentos</TabsTrigger>
        <TabsTrigger value="dividas" className="gap-1"><AlertTriangle className="w-4 h-4" /> Dívidas</TabsTrigger>
        <TabsTrigger value="config" className="gap-1"><Settings className="w-4 h-4" /> Configurações</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <FinDashboard
          onAbrirContas={() => setTab('contas')}
          onAbrirTransacoes={(mov, mes) => { setMovInicial(mov); setMesInicial(mes); setTab('transacoes'); }}
        />
      </TabsContent>
      <TabsContent value="contas"><FinContasView /></TabsContent>
      <TabsContent value="transacoes"><FinTransacoesView movimentoInicial={movInicial} mesInicial={mesInicial} /></TabsContent>
      <TabsContent value="financiamentos"><FinFinanciamentosView /></TabsContent>
      <TabsContent value="dividas"><FinDividasView /></TabsContent>
      <TabsContent value="config"><FinConfiguracoes /></TabsContent>
    </Tabs>
  );
}
