export interface Perfil {
  codigo: number;
  nome: string | null;
  totalCasosDeUso: number;
}

export interface PerfilFilter {
  nome?: string;
}

export interface PerfilPayload {
  nome: string;
}

export interface CasoUsoSimple {
  codigo: number;
  sigla: string | null;
  nome: string | null;
}
