export interface TipoEntidadeExterna {
  codigo: string;
  nome: string | null;
}

export interface CreateTipoEntidadeExternaPayload { nome: string; }
export interface UpdateTipoEntidadeExternaPayload { nome?: string; }
