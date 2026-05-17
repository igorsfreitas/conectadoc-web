export interface ProfileResponse {
  usuario: {
    codigo: number;
    nome: string;
    cpf: string;
    email?: string | null;
  };
  isAdmin: boolean;
  permissions: string[];
}
