import { HttpClient } from "@afinz/rest-client";
import { CreateHierarquiaPayload, HierarquiaSegmento, UpdateHierarquiaPayload } from "../../../features/hierarquia/models/hierarquia.model";

export class HierarquiaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(): Promise<HierarquiaSegmento[]> {
    const response = await this.httpClient.get<HierarquiaSegmento[]>("/v1/hierarquia");
    return response.data;
  }

  async findOne(codigo: string): Promise<HierarquiaSegmento> {
    const response = await this.httpClient.get<HierarquiaSegmento>(`/v1/hierarquia/${codigo}`);
    return response.data;
  }

  async create(payload: CreateHierarquiaPayload): Promise<HierarquiaSegmento> {
    const response = await this.httpClient.post<HierarquiaSegmento>("/v1/hierarquia", payload);
    return response.data;
  }

  async update(codigo: string, payload: UpdateHierarquiaPayload): Promise<HierarquiaSegmento> {
    const response = await this.httpClient.patch<HierarquiaSegmento>(`/v1/hierarquia/${codigo}`, payload);
    return response.data;
  }

  async remove(codigo: string): Promise<void> {
    await this.httpClient.delete(`/v1/hierarquia/${codigo}`);
  }
}
