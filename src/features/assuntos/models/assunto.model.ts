export interface ItemArquivologia {
  id: string;
  codigo: string | null;
  codigoCompleto: string | null;
  nome: string | null;
}

export interface Assunto {
  codigo: number;
  descricao?: string | null;
  anosPrescricao?: number | null;
  classificacao?: ItemArquivologia | null;
}

export interface AssuntoPayload {
  descricao: string;
  anosPrescricao?: number | null;
}
