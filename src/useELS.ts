import { inject } from "vue";
import type { ErrorEntry } from "@inso_web/els-client";
import { ELSKey } from "./symbols.js";
import type { ELSInjection } from "./symbols.js";

export function useELS(): ELSInjection & {
  report: (err: unknown, extra?: Partial<ErrorEntry>) => void;
} {
  const ctx = inject(ELSKey);
  if (!ctx) {
    throw new Error(
      "useELS: ELSPlugin не установлен. Вызовите app.use(ELSPlugin, { config }).",
    );
  }
  const report = (err: unknown, extra?: Partial<ErrorEntry>) => {
    const e = err as Error | undefined;
    const entry: ErrorEntry = {
      message: e?.message ?? String(err),
      stack: e?.stack,
      url:
        typeof location !== "undefined" ? location.href : extra?.url ?? "",
      level: "error",
      source: "client",
      ...extra,
    };
    if (ctx.queue) ctx.queue.enqueue(entry);
    else void ctx.client.sendError(entry);
  };
  return { ...ctx, report };
}
