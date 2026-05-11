export interface ProfileResponse {
  id: string;
  external_ref: number;
  document: string;
  name: string;
  address: Address;
}

export interface Address {
  kind: string;
  line1: string;
  number: string;
  line2: string;
  district: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}
