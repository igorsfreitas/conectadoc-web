import { HttpClient } from '@afinz/rest-client';
import { CasoUso, CasoUsoFilter, CasoUsoPayload } from '../../../features/caso-uso/models/caso-uso.model';
import { Paginated } from '../../types/paginated';

export class CasoUsoService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20, filter: CasoUsoFilter = {}): Promise<Paginated<CasoUso>> {
    const res = await this.httpClient.get<Paginated<CasoUso>>('/v1/caso-uso', { params: { page, limit, ...filter } });
    return res.data;
  }

  async findAllSimple(): Promise<CasoUso[]> {
    const res = await this.httpClient.get<CasoUso[]>('/v1/caso-uso/simple');
    return res.data;
  }

  async findOne(id: number): Promise<CasoUso> {
    const res = await this.httpClient.get<CasoUso>(`/v1/caso-uso/${id}`);
    return res.data;
  }

  async create(payload: CasoUsoPayload): Promise<CasoUso> {
    const res = await this.httpClient.post<CasoUso>('/v1/caso-uso', payload);
    return res.data;
  }

  async update(id: number, payload: Partial<CasoUsoPayload>): Promise<CasoUso> {
    const res = await this.httpClient.patch<CasoUso>(`/v1/caso-uso/${id}`, payload);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/caso-uso/${id}`);
  }
}
