import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Download, Eye, Trash2, Loader2 } from 'lucide-react';
import { useAnexos, urlAnexo, Anexo } from '@/hooks/use-anexos';
import { useToast } from '@/hooks/use-toast';

function tamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  atendimentoId: string;
  podeEditar?: boolean;
}

export function AnexosEditor({ atendimentoId, podeEditar = true }: Props) {
  const { anexos, enviar, remover } = useAnexos(atendimentoId);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setEnviando(true);
    for (const file of Array.from(files)) {
      const { error } = await enviar(file);
      if (error) toast({ title: 'Falha ao anexar', description: `${file.name}: ${error}`, variant: 'destructive' });
    }
    setEnviando(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const abrir = async (a: Anexo, download: boolean) => {
    const url = await urlAnexo(a.path, download);
    if (!url) {
      toast({ title: 'Não foi possível abrir o arquivo', variant: 'destructive' });
      return;
    }
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> Anexos {anexos.length > 0 && `(${anexos.length})`}
        </span>
        {podeEditar && (
          <Button type="button" variant="outline" size="sm" disabled={enviando} onClick={() => inputRef.current?.click()}>
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar arquivos'}
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      {anexos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum arquivo anexado.</p>
      ) : (
        <ul className="space-y-1">
          {anexos.map(a => (
            <li key={a.id} className="flex items-center gap-2 text-sm bg-secondary/40 rounded px-2 py-1">
              <span className="truncate flex-1">{a.nome}</span>
              <span className="text-xs text-muted-foreground shrink-0">{tamanho(a.tamanho)}</span>
              <Button type="button" variant="ghost" size="sm" title="Visualizar" onClick={() => abrir(a, false)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" title="Baixar" onClick={() => abrir(a, true)}>
                <Download className="w-4 h-4" />
              </Button>
              {podeEditar && (
                <Button type="button" variant="ghost" size="sm" title="Remover" className="hover:text-destructive" onClick={() => remover(a)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
