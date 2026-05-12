import { HttpClient } from "@afinz/rest-client";
import { CreateHierarquiaPayload, HierarquiaSegmento, UpdateHierarquiaPayload } from "../../../features/hierarquia/models/hierarquia.model";
import { Paginated } from "../../types/paginated";

export class HierarquiaService {
  constructor(private readonly httpClient: HttpClient) {}

  async findAll(page = 1, limit = 20): Promise<Paginated<HierarquiaSegmento>> {
    const response = await this.httpClient.get<Paginated<HierarquiaSegmento>>("/v1/hierarquia", {
      params: { page, limit },
    });
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
