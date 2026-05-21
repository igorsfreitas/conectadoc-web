export interface ProfileResponse {
  usuario: {
    codigo: number;
    nome: string;
    cpf: string;
    email?: string | null;
    fotoUrl?: string | null;
  };
  isAdmin: boolean;
  permissions: string[];
}
