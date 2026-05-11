export interface AuthFirstAccessRequest {
  document: string;
}

export interface AuthFirstAccessResponse {
  challenge_id: string;
  destination: string;
  ttl_seconds: number;
}

export interface AuthSendRequest {
  purpose: string;
  login: string;
  delivery: string;
  channel: string;
}

export interface AuthSendResponse {
  challenge_id: string;
  destination: string;
  ttl_seconds: number;
}

export interface AuthVerifyRequest {
  challenge_id: string;
  code: string;
}

export interface AuthVerifyResponse {
  reset_token: string;
  expires_at: string;
}

export interface AuthResetRequest {
  reset_token: string;
  new_password: string;
}

export interface AuthResetResponse {
  message: string;
}

export interface AuthLoginRequest {
  login: string;
  password: string;
}

export interface AuthLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
