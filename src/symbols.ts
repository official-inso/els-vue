import type { InjectionKey } from "vue";
import type { ELSClient, ELSQueue } from "@inso_web/els-client";

/** Shape of the value provided by {@link ELSPlugin} and read via {@link useELS}. */
export interface ELSInjection {
  /** The shared ELS client. */
  client: ELSClient;
  /** The batching queue, or `null` when `useQueue` is disabled. */
  queue: ELSQueue | null;
}

/** Vue `InjectionKey` for the ELS client/queue. Prefer the {@link useELS} composable. */
export const ELSKey: InjectionKey<ELSInjection> = Symbol("ELSInjection");
