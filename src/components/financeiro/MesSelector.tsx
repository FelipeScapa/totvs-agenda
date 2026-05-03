import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { labelMes, navegarMes, mesAtual } from '@/lib/financeiro-utils';

interface Props {
  mes: string;
  onChange: (mes: string) => void;
}

export function MesSelector({ mes, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(navegarMes(mes, -1))}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <button
        onClick={() => onChange(mesAtual())}
        className="px-3 py-1 text-sm font-medium capitalize hover:bg-accent rounded min-w-[180px] text-center"
      >
        {labelMes(mes)}
      </button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(navegarMes(mes, 1))}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
