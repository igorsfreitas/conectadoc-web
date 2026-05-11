export enum LogFlagType {
  API_REQUEST = "apiRequest",
  API_SUCCESS = "apiSuccessResponse",
  API_ERROR = "apiError",
}

export interface AfinzLogModel {
  logFlagType?: LogFlagType;
  requestTime?: string;
  error?: unknown;
  request: {
    method?: string;
    baseUrl?: string;
    route?: string;
    url?: string;
    headers: Record<string, unknown>;
    queryParameters?: unknown;
    data?: unknown;
  };
  response?: {
    statusCode?: number;
    body?: unknown;
  };
}

export interface DeviceInfoModel {
  device?: string;
  os?: string;
  version?: string;
}

export interface UserInfoModel {
  cpf?: string;
  uuid?: string;
}

export interface OpenSearchModel {
  appVersion?: string;
  deviceInfoModel?: DeviceInfoModel;
  userInfoModel: UserInfoModel;
  afinzLogModel?: AfinzLogModel;
}
