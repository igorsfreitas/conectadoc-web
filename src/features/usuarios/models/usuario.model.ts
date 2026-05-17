export interface Usuario {
  codigo: number;
  nome: string | null;
  cpf: string | null;
  matricula: string | null;
  matriculaReal: string | null;
  email: string | null;
  funcao: string | null;
  projAtv: string | null;
  localTrabalho: string | null;
  endTrabalho: string | null;
  telefone: string | null;
  celular: string | null;
  ramais: string | null;
  rg: string | null;
  orgaoExp: string | null;
  dataNascimento: string | null;
  tipoSanguineo: number | null;
  segmento: number | null;
  entidadeExterna: number | null;
  flagEstagiario: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  obs: string | null;
  nomeAbreviado: string | null;
  flagExcluido: number | null;
  tipo: string | null;
  senha?: string | null;
  fotoUrlSigned?: string | null;
  assinaturaUrlSigned?: string | null;
}

export interface UsuarioFilter {
  nome?: string;
  cpf?: string;
  matricula?: string;
  ativo?: boolean;
  inativo?: boolean;
}

export interface UsuarioPayload {
  nome: string;
  cpf: string;
  senha?: string;
  matricula?: string;
  matriculaReal?: string;
  email?: string;
  funcao?: string;
  projAtv?: string;
  localTrabalho?: string;
  endTrabalho?: string;
  telefone?: string;
  celular?: string;
  ramais?: string;
  rg?: string;
  orgaoExp?: string;
  dataNascimento?: string;
  tipoSanguineo?: number;
  segmento?: number;
  entidadeExterna?: number;
  estagiario?: boolean;
  dataInicio?: string;
  dataFim?: string;
  obs?: string;
  nomeAbreviado?: string;
  inativo?: boolean;
  tipo?: string;
}

export interface PerfilSimple {
  codigo: number;
  nome: string | null;
}

export const TIPO_SANGUINEO: Record<number, string> = {
  1: 'A+', 2: 'A-', 3: 'B+', 4: 'B-',
  5: 'AB+', 6: 'AB-', 7: 'O+', 8: 'O-',
};
