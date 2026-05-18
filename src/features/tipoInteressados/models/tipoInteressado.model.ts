export interface TipoInteressado {
  codigo: number;
  descricao?: string | null;
  sigla?: string | null;
}

export interface TipoInteressadoPayload {
  descricao?: string | null;
  sigla?: string | null;
}
