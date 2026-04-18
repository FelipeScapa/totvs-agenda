import { useState } from 'react';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Selecionar...', className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter(s => s !== v));
    else onChange([...selected, v]);
  };

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? selected[0]
      : `${selected.length} selecionados`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 text-xs justify-between gap-1", className)}>
          <span className="flex items-center gap-1 truncate">
            <Filter className="w-3 h-3 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{selected.length}</Badge>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-popover" align="start">
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent rounded"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">Sem opções</div>
          )}
          {options.map(opt => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-left"
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary border-primary" : "border-border"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
