export interface HierarquiaSegmento {
  codigo: string;
  nome: string | null;
  flagEl: string | null;
}

export interface CreateHierarquiaPayload {
  nome: string;
  flagEl?: string | null;
}

export interface UpdateHierarquiaPayload {
  nome?: string;
  flagEl?: string | null;
}
