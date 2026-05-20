import type { App, Plugin } from "vue";
import { ELSClient, ELSQueue } from "@inso_web/els-client";
import type { ELSConfig } from "@inso_web/els-client";
import { ELSKey } from "./symbols.js";
import { buildErrorHandler } from "./errorHandler.js";

/** Options for {@link ELSPlugin}. */
export interface ELSPluginOptions {
  /** ELS client configuration (only `apiKey` + `appSlug` are required). */
  config: ELSConfig;
  /** Use a batching queue. Default: `true`. */
  useQueue?: boolean;
  /** Queue auto-flush interval, in ms. */
  flushIntervalMs?: number;
  /** Max entries buffered before an early flush. */
  maxBatchSize?: number;
  /** Auto-subscribe to `window.onerror` and `unhandledrejection`. Default: `true`. */
  captureGlobalErrors?: boolean;
}

/**
 * Vue plugin that installs an ELS client, hooks Vue's `errorHandler`, and (by
 * default) captures global errors. Install once at app creation.
 *
 * @example
 * createApp(App).use(ELSPlugin, {
 *   config: { apiKey: "els_live_…", appSlug: "web" },
 * }).mount("#app");
 */
export const ELSPlugin: Plugin = {
  install(app: App, options: ELSPluginOptions) {
    if (!options?.config) {
      throw new Error("ELSPlugin: options.config is required");
    }

    const client = new ELSClient(options.config);
    const queue =
      options.useQueue !== false
        ? new ELSQueue(client, {
            flushIntervalMs: options.flushIntervalMs,
            maxBatchSize: options.maxBatchSize,
          })
        : null;

    app.provide(ELSKey, { client, queue });

    const handler = buildErrorHandler(client, queue);
    const prev = app.config.errorHandler;
    app.config.errorHandler = (err, instance, info) => {
      handler(err, instance, info);
      prev?.(err, instance, info);
    };

    if (
      options.captureGlobalErrors !== false &&
      typeof window !== "undefined"
    ) {
      window.addEventListener("error", (event: ErrorEvent) => {
        handler(event.error ?? event.message, null, "window.onerror");
      });
      window.addEventListener(
        "unhandledrejection",
        (event: PromiseRejectionEvent) => {
          handler(event.reason, null, "unhandledrejection");
        },
      );
    }
  },
};
