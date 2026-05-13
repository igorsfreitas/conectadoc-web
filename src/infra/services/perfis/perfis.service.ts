import { HttpClient } from '@afinz/rest-client';
import { Perfil, PerfilFilter, PerfilPayload, CasoUsoSimple } from '../../../features/perfis/models/perfil.model';
import { Paginated } from '../../types/paginated';

export class PerfisService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 50, filter: PerfilFilter = {}): Promise<Paginated<Perfil>> {
    const res = await this.httpClient.get<Paginated<Perfil>>('/v1/perfis', { params: { page, limit, ...filter } });
    return res.data;
  }

  async create(payload: PerfilPayload): Promise<Perfil> {
    const res = await this.httpClient.post<Perfil>('/v1/perfis', payload);
    return res.data;
  }

  async update(id: number, payload: Partial<PerfilPayload>): Promise<Perfil> {
    const res = await this.httpClient.patch<Perfil>(`/v1/perfis/${id}`, payload);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/perfis/${id}`);
  }

  async findCasosDeUso(perfilId: number): Promise<CasoUsoSimple[]> {
    const res = await this.httpClient.get<CasoUsoSimple[]>(`/v1/perfis/${perfilId}/casos-de-uso`);
    return res.data;
  }

  async addCasoDeUso(perfilId: number, ucId: number): Promise<void> {
    await this.httpClient.post(`/v1/perfis/${perfilId}/casos-de-uso/${ucId}`);
  }

  async removeCasoDeUso(perfilId: number, ucId: number): Promise<void> {
    await this.httpClient.delete(`/v1/perfis/${perfilId}/casos-de-uso/${ucId}`);
  }
}
