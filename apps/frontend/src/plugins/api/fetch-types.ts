import type { FetchOptions, ResolvedFetchOptions } from "ofetch";
import type { NitroFetchOptions } from "nitropack";
import type { RouterMethod } from "h3";

type MaybePromise<T> = T | Promise<T>;

export interface AuthProvider {
  getToken(): MaybePromise<string | null | undefined>;
}

export interface FetchOptionExtension {
  auth?: AuthProvider | (() => AuthProvider | null | undefined) | null;
}

export type ResolvedAPIFetchOptions = ResolvedFetchOptions & FetchOptionExtension;

export type APIFetchOptions = FetchOptions & FetchOptionExtension;

export type APINitroFetchOptions = NitroFetchOptions<string, RouterMethod> & FetchOptionExtension;
