import type { components } from "./schema.d.ts";

export type User = components["schemas"]["User"];

export interface Session {
  id: string;
  session: string;
  user_id: string;
  created: string;
  last_login: string;
  expires: string;
  refresh_expires: string;
  os: string;
  platform: string;
  user_agent: string;
  city: string;
  country: string;
  ip: string;
  current: boolean;
}
