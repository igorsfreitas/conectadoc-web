export interface UnidadeAdministrativa {
  codigo: number;
  nome: string | null;
  sigla: string | null;
  codigoPai: number | null;
  codigoHierarquia: string | null;
  codigoEntidadeExterna: string | null;
  flagAtivo: string | null;
  flagProtocoloCentral: string | null;
  recebeDocExterno: string | null;
}

export interface CreateUnidadeAdministrativaPayload {
  nome: string;
  sigla: string;
  ativo?: boolean;
  protocoloCentral?: boolean;
  recebeDocExterno?: boolean;
  codigoPai?: string;
  codigoHierarquia?: string;
  codigoEntidadeExterna?: string;
}

export interface UpdateUnidadeAdministrativaPayload {
  nome?: string;
  sigla?: string;
  ativo?: boolean;
  protocoloCentral?: boolean;
  recebeDocExterno?: boolean;
  codigoPai?: string;
  codigoHierarquia?: string;
  codigoEntidadeExterna?: string;
}

export interface UnidadeAdministrativaFilter {
  q?: string;
  nome?: string;
  sigla?: string;
  protocoloCentral?: boolean;
  codigoEntidadeExterna?: string;
}
