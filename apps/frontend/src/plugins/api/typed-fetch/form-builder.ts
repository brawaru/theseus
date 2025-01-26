export interface FormBuilderProviders<Form> {
  value<K extends keyof Form>(key: K, value: Form[K] extends string ? string : never): void;
  json<K extends keyof Form>(key: K, value: Form[K]): void;
  blob<K extends keyof Form>(key: K, value: Blob): void;
  raw<K extends keyof Form | (string & Record<never, never>)>(key: K, value: string | Blob): void;
}

export type FormBuilder<Form> = (providers: FormBuilderProviders<Form>) => void;

export function invokeFormBuilder(builder: FormBuilder<Record<string, any>>) {
  const fd = new FormData();
  builder({
    blob(key, value) {
      fd.set(key, value);
    },
    json(key, value) {
      fd.set(key, JSON.stringify(value));
    },
    value(key, value) {
      fd.set(key, value);
    },
    raw(key, value) {
      fd.set(key, value);
    },
  });
  return fd;
}
