import type { InjectionKey } from "vue";
import type { ELSClient, ELSQueue } from "@inso_web/els-client";

export interface ELSInjection {
  client: ELSClient;
  queue: ELSQueue | null;
}

export const ELSKey: InjectionKey<ELSInjection> = Symbol("ELSInjection");
