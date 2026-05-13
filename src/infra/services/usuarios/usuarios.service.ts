import { HttpClient } from '@afinz/rest-client';
import { Usuario, UsuarioFilter, UsuarioPayload, PerfilSimple } from '../../../features/usuarios/models/usuario.model';
import { Paginated } from '../../types/paginated';

export class UsuariosService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 50, filter: UsuarioFilter = {}): Promise<Paginated<Usuario>> {
    const res = await this.httpClient.get<Paginated<Usuario>>('/v1/usuarios', { params: { page, limit, ...filter } });
    return res.data;
  }

  async findOne(id: number): Promise<Usuario> {
    const res = await this.httpClient.get<Usuario>(`/v1/usuarios/${id}`);
    return res.data;
  }

  async create(payload: UsuarioPayload): Promise<Usuario> {
    const res = await this.httpClient.post<Usuario>('/v1/usuarios', payload);
    return res.data;
  }

  async update(id: number, payload: Partial<UsuarioPayload>): Promise<Usuario> {
    const res = await this.httpClient.patch<Usuario>(`/v1/usuarios/${id}`, payload);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}`);
  }

  async findPerfis(id: number): Promise<PerfilSimple[]> {
    const res = await this.httpClient.get<PerfilSimple[]>(`/v1/usuarios/${id}/perfis`);
    return res.data;
  }

  async addPerfil(id: number, perfilId: number): Promise<void> {
    await this.httpClient.post(`/v1/usuarios/${id}/perfis/${perfilId}`);
  }

  async removePerfil(id: number, perfilId: number): Promise<void> {
    await this.httpClient.delete(`/v1/usuarios/${id}/perfis/${perfilId}`);
  }
}
