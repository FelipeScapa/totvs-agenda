import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';

interface Props extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: number;
  onChange: (v: number) => void;
}

function format(cents: number) {
  const v = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `R$ ${v}`;
}

export const CurrencyInput = forwardRef<HTMLInputElement, Props>(({ value, onChange, ...rest }, ref) => {
  const cents = Math.round((Number(value) || 0) * 100);
  const display = format(cents);

  return (
    <Input
      ref={ref}
      inputMode="numeric"
      {...rest}
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        const n = digits ? Number(digits) / 100 : 0;
        onChange(n);
      }}
      onFocus={(e) => { e.target.select(); rest.onFocus?.(e); }}
    />
  );
});
CurrencyInput.displayName = 'CurrencyInput';
