export interface ItemArquivologia {
  id: string;
  codigo: string | null;
  codigoCompleto: string | null;
  nome: string | null;
  tipo: string | null;
  obs: string | null;
  prazoCorrente: string | null;
  prazoIntermediario: string | null;
  anosCorrente: string | null;
  anosIntermediario: string | null;
  destinacaoFinal: string | null;
  flagEl: string | null;
  idPai: string | null;
  pai?: ItemArquivologia | null;
  filhos?: ItemArquivologia[];
}

export interface HierarquiaPayload {
  codigo?: string | null;
  nome?: string | null;
  tipo?: string | null;
  idPai?: string | null;
  obs?: string | null;
  prazoCorrente?: string | null;
  prazoIntermediario?: string | null;
  anosCorrente?: string | null;
  anosIntermediario?: string | null;
  destinacaoFinal?: string | null;
}
