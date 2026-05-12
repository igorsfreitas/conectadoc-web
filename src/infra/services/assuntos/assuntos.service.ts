import { HttpClient } from '@afinz/rest-client';

import { Assunto, AssuntoPayload } from '../../../features/assuntos/models/assunto.model';
import { Paginated } from '../../types/paginated';

export class AssuntosService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20): Promise<Paginated<Assunto>> {
    const res = await this.httpClient.get<Paginated<Assunto>>('/v1/assuntos', {
      withCredentials: true,
      params: { page, limit },
    });
    return res.data;
  }

  async findOne(id: number): Promise<Assunto> {
    const res = await this.httpClient.get<Assunto>(`/v1/assuntos/${id}`, { withCredentials: true });
    return res.data;
  }

  async create(payload: AssuntoPayload): Promise<Assunto> {
    const res = await this.httpClient.post<Assunto>('/v1/assuntos', payload, { withCredentials: true });
    return res.data;
  }

  async update(id: number, payload: Partial<AssuntoPayload>): Promise<Assunto> {
    const res = await this.httpClient.patch<Assunto>(`/v1/assuntos/${id}`, payload, { withCredentials: true });
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/assuntos/${id}`, { withCredentials: true });
  }
}
