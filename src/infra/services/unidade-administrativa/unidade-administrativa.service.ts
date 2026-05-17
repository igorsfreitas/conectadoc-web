import { HttpClient } from '@afinz/rest-client';

import {
  UnidadeAdministrativa,
  CreateUnidadeAdministrativaPayload,
  UpdateUnidadeAdministrativaPayload,
  UnidadeAdministrativaFilter,
} from '../../../features/unidade-administrativa/models/unidade-administrativa.model';
import { Paginated } from '../../types/paginated';

export class UnidadeAdministrativaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20, filter: UnidadeAdministrativaFilter = {}): Promise<Paginated<UnidadeAdministrativa>> {
    const res = await this.httpClient.get<Paginated<UnidadeAdministrativa>>('/v1/unidade-administrativa', {
      params: { page, limit, ...filter },
    });
    return res.data;
  }

  /** Busca livre por nome OU sigla — usada nos autocompletes */
  async search(q: string, limit = 20): Promise<Paginated<UnidadeAdministrativa>> {
    const res = await this.httpClient.get<Paginated<UnidadeAdministrativa>>('/v1/unidade-administrativa', {
      params: { q, limit, page: 1 },
    });
    return res.data;
  }

  async findAllSimple(): Promise<UnidadeAdministrativa[]> {
    const res = await this.httpClient.get<UnidadeAdministrativa[]>('/v1/unidade-administrativa/simple');
    return res.data;
  }

  async findOne(id: number): Promise<UnidadeAdministrativa> {
    const res = await this.httpClient.get<UnidadeAdministrativa>(`/v1/unidade-administrativa/${id}`);
    return res.data;
  }

  async create(payload: CreateUnidadeAdministrativaPayload): Promise<UnidadeAdministrativa> {
    const res = await this.httpClient.post<UnidadeAdministrativa>('/v1/unidade-administrativa', payload);
    return res.data;
  }

  async update(id: number, payload: UpdateUnidadeAdministrativaPayload): Promise<UnidadeAdministrativa> {
    const res = await this.httpClient.patch<UnidadeAdministrativa>(`/v1/unidade-administrativa/${id}`, payload);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/unidade-administrativa/${id}`);
  }
}
