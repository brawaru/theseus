import type { APIFetchOptions } from "./fetch-types.ts";

export interface APIConfig {
  apiBaseURL: string;
  fetchOpts?: APIFetchOptions;
}
