export interface CasoUso {
  codigo: number;
  sigla: string | null;
  nome: string | null;
  flagExcluido: number | null;
}

export interface CasoUsoFilter {
  sigla?: string;
  nome?: string;
}

export interface CasoUsoPayload {
  sigla: string;
  nome?: string;
}
