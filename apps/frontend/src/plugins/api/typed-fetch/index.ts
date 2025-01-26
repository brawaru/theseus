import type { FetchOptions, FetchResponse } from "ofetch";
import type { NitroFetchOptions, $Fetch } from "nitropack";
import type { SuccessResponse, ResponseObjectMap, HttpMethod } from "openapi-typescript-helpers";
import { invokeFormBuilder, type FormBuilder } from "./form-builder.ts";

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

interface MethodParameters {
  query?: Record<string, any>;
  path?: Record<string, string>;
}

type $PathFetchOptions<Method> = Method extends {
  parameters: infer Params extends MethodParameters;
}
  ? (Params["query"] extends undefined ? { query?: {} } : { query: Params["query"] }) &
      (Params["path"] extends undefined ? { path?: {} } : { path: Params["path"] })
  : { query?: {}; path?: {} };

type DefaultRequestBody = BaseFetchOptions["body"];

type DefaultRequestForm = FormBuilder<Record<string, any>>;

type $PathRequestBodyOptions<Method> = Method extends {
  requestBody?: infer RequestBody;
}
  ? RequestBody extends { content: infer ContentTypes }
    ? ContentTypes extends { "application/json": infer T }
      ? { body: Record<string, any> & T; form?: DefaultRequestForm }
      : ContentTypes extends { "multipart/form-data": infer Form }
        ?
            | { body?: FormData; form: FormBuilder<Form> }
            | { body: FormData; form?: FormBuilder<Form> }
        : { body: DefaultRequestBody; form?: DefaultRequestForm }
    : { body?: DefaultRequestBody; form?: DefaultRequestForm }
  : { body?: DefaultRequestBody; form?: DefaultRequestForm };

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
} & {
  form?: DefaultRequestForm;
};

export function createTypedFetch<Paths>(defaults: FetchOptions = {}): TypedFetch<Paths> {
  const $fetchImpl = $fetch.create<unknown, string>(defaults);

  function getFetchArgs(
    path: string,
    opts?: SimplifiedFetchOptions,
  ): [path: string, opts: NitroFetchOptions<string, any> | undefined] {
    if (opts?.form) {
      const fd = invokeFormBuilder(opts.form);

      if (opts.body instanceof FormData) {
        for (const [name, value] of opts.body.entries()) fd.set(name, value);
      } else if (import.meta.dev) {
        console.trace(
          'This instance of typedFetch is called with both "form" and "body", but the latter is not a FormData. This will replace the body and likely, is a mistake.',
        );
      }

      opts.body = fd;
    }

    let nf: NitroFetchOptions<string, any> | undefined;
    if (opts != null) {
      // omitting our properties from the options just to be safe
      const { form: _form, path: _path, ...rest } = opts;
      nf = { ...rest };
    }

    let finalPath = path as string;
    if (opts?.path) finalPath = replaceParameters(finalPath, opts.path);

    return [finalPath, nf];
  }

  const fetch: DefaultTypedFetch<Paths> = function normalizeFetchCall(path, options) {
    return $fetchImpl(...getFetchArgs(path, options as never));
  };

  const raw: RawTypedFetch<Paths> = function normalizeRawFetchCall(path, options) {
    return $fetchImpl.raw(...getFetchArgs(path, options as never));
  };

  return Object.assign(fetch, { raw, base: $fetchImpl });
}
