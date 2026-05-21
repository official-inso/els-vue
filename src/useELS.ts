import { inject } from "vue";
import type { ErrorEntry, WritableErrorEntry } from "@inso_web/els-client";
import { ELSKey } from "./symbols.js";
import type { ELSInjection } from "./symbols.js";

/**
 * Composable that returns the injected ELS `client`/`queue` plus a
 * `report(error, extra?)` helper. Requires {@link ELSPlugin} to be installed.
 *
 * @example
 * const { client, report } = useELS();
 * client.info("checkout opened");
 * try { await pay(); } catch (e) { report(e, { url: "/pay" }); }
 */
export function useELS(): ELSInjection & {
  report: (err: unknown, extra?: Partial<WritableErrorEntry>) => void;
} {
  const ctx = inject(ELSKey);
  if (!ctx) {
    throw new Error(
      "useELS: ELSPlugin is not installed. Call app.use(ELSPlugin, { config }).",
    );
  }
  const report = (err: unknown, extra?: Partial<WritableErrorEntry>) => {
    const e = err as Error | undefined;
    const entry: WritableErrorEntry = {
      message: e?.message ?? String(err),
      stack: e?.stack,
      level: "error",
      ...extra,
    };
    // Browser-side: source/url are resolved by the client (location.href).
    if (ctx.queue) ctx.queue.enqueue(entry as ErrorEntry);
    else void ctx.client.sendError(entry as ErrorEntry);
  };
  return { ...ctx, report };
}
