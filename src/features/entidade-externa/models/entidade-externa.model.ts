export interface EntidadeExterna {
  codigo: number;
  nome: string | null;
  sigla: string | null;
  codigoTipo: string | null;
  endereco: string | null;
  fone: string | null;
  email: string | null;
  flagTramitaNetdoc: string | null;
}

export interface CreateEntidadeExternaPayload {
  nome: string;
  sigla: string;
  codigoTipo?: string;
  endereco?: string;
  fone?: string;
  email?: string;
  tramitaNetdoc?: boolean;
}

export interface UpdateEntidadeExternaPayload {
  nome?: string;
  sigla?: string;
  codigoTipo?: string;
  endereco?: string;
  fone?: string;
  email?: string;
  tramitaNetdoc?: boolean;
}
