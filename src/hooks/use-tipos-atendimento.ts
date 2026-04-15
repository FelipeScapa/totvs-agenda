import { useState, useEffect, useCallback } from 'react';

export interface TipoCustom {
  id: string;
  label: string;
}

const STORAGE_KEY = 'agenda-log-tipos';

const DEFAULTS: TipoCustom[] = [
  { id: 'SUPORTE', label: 'Suporte' },
  { id: 'AJUSTE', label: 'Ajuste' },
  { id: 'REUNIAO', label: 'Reunião' },
  { id: 'INVESTIGACAO', label: 'Investigação' },
];

function load(): TipoCustom[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(tipos: TipoCustom[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tipos));
}

export function useTiposAtendimento() {
  const [tipos, setTipos] = useState<TipoCustom[]>(load);

  useEffect(() => { save(tipos); }, [tipos]);

  const adicionar = useCallback((label: string) => {
    const id = label.trim().toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    setTipos(prev => [...prev, { id, label: label.trim() }]);
  }, []);

  const remover = useCallback((id: string) => {
    setTipos(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tipos, adicionar, remover };
}
