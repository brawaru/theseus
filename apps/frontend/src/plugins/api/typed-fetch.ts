import type { FetchOptions, FetchResponse } from "ofetch";
import type { NitroFetchOptions, $Fetch } from "nitropack";
import type { SuccessResponse, ResponseObjectMap, HttpMethod } from "openapi-typescript-helpers";

/*

  This file was written primarily by me, with inspiration from the `nuxt-open-fetch` module
  by Taras Batenkov (@enkot). While most of the code here was developed independently, a few
  elements, such as defaulting the method to "get" when none specified, were referenced from
  their implementation.

  As such, I believe it's important to give proper credit:

  Portions of this file include code from the `nuxt-open-fetch` project, licensed under the
  MIT license:

  Copyright (c) 2023 Enkot

  Full LICENSE available at:
  https://github.com/enkot/nuxt-open-fetch/blob/67355e27874c80ba37a2c694e7ff1523877f8c19/LICENSE.

*/

type BaseFetchOptions = Omit<NitroFetchOptions<string, any>, "method">;

interface Parameters {
  query?: Record<string, any>;
  path?: Record<string, string>;
}

type $PathFetchOptions<Method> = Method extends {
  parameters: infer Params extends Parameters;
}
  ? (Params["query"] extends undefined ? { query?: {} } : { query: Params["query"] }) &
      (Params["path"] extends undefined ? { path?: {} } : { path: Params["path"] })
  : { query?: {}; path?: {} };

type DefaultRequestBody = BaseFetchOptions["body"];

type $PathRequestBodyOptions<Method> = Method extends { requestBody?: infer RequestBody }
  ? RequestBody extends { content: infer ContentTypes }
    ? ContentTypes extends { "application/json": infer T }
      ? { body: Record<string, any> & T }
      : ContentTypes extends { "multipart/form-data": any }
        ? { body: FormData }
        : { body: DefaultRequestBody }
    : { body?: DefaultRequestBody }
  : { body?: DefaultRequestBody };

type $PathMethodsKeys<Path> = {
  [K in keyof Path]-?: K extends HttpMethod
    ? Path[K] extends never | undefined
      ? never
      : K
    : never;
}[keyof Path];

type $PathMethods<Path> = Pick<Path, $PathMethodsKeys<Path>>;

type $MethodOption<Method, PathMethods> = "get" extends PathMethods
  ? { method?: Method }
  : { method: Method };

type $PathMethodSuccessfulResponse<Method> = SuccessResponse<
  Method extends infer Operation extends { responses: any } ? ResponseObjectMap<Operation> : never
>;

type TypedFetchCommonized<Paths, FetchKind extends "raw" | "default"> = <
  Path extends string & keyof Paths,
  PathMethods extends $PathMethods<Paths[Path]>,
  Method extends Extract<keyof PathMethods, string>,
  DefaultedMethod extends "get" extends Method ? "get" : Method,
>(
  path: Path,
  options?: Omit<BaseFetchOptions, "body"> &
    $MethodOption<Method, keyof PathMethods> &
    $PathFetchOptions<PathMethods[DefaultedMethod]> &
    $PathRequestBodyOptions<PathMethods[DefaultedMethod]>,
) => Promise<
  FetchKind extends "raw"
    ? FetchResponse<$PathMethodSuccessfulResponse<PathMethods[DefaultedMethod]>>
    : $PathMethodSuccessfulResponse<PathMethods[DefaultedMethod]>
>;

type RawTypedFetch<Paths> = TypedFetchCommonized<Paths, "raw">;
type DefaultTypedFetch<Paths> = TypedFetchCommonized<Paths, "default">;

export interface TypedFetch<Paths> extends DefaultTypedFetch<Paths> {
  raw: RawTypedFetch<Paths>;
  base: $Fetch<string, any>;
}

function replaceParameters(path: string, parameters: Record<string, string>) {
  let result = path;
  for (const [parameter, value] of Object.entries(parameters)) {
    result = result.replaceAll(`{${parameter}}`, encodeURIComponent(value));
  }
  return result;
}

type SimplifiedFetchOptions = BaseFetchOptions & { method: HttpMethod } & {
  path?: Record<string, string>;
};

export function createTypedFetch<Paths>(defaults: FetchOptions = {}): TypedFetch<Paths> {
  const $fetchImpl = $fetch.create<unknown, string>(defaults);

  const fetch: DefaultTypedFetch<Paths> = function normalizeFetchCall(path, options) {
    const opts = options as SimplifiedFetchOptions;
    let finalPath = path as string;
    if (opts?.path) finalPath = replaceParameters(finalPath, opts.path);
    return $fetchImpl(finalPath, opts as any) as any;
  };

  const raw: RawTypedFetch<Paths> = function normalizeRawFetchCall(path, options) {
    const opts = options as SimplifiedFetchOptions;
    let finalPath = path as string;
    if (opts?.path) finalPath = replaceParameters(finalPath, opts.path);
    return $fetchImpl.raw(finalPath, opts as any);
  };

  return Object.assign(fetch, { raw, base: $fetchImpl });
}
