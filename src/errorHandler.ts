import type { ELSClient, ELSQueue, ErrorEntry } from "@inso_web/els-client";

export function buildErrorHandler(client: ELSClient, queue: ELSQueue | null) {
  return (err: unknown, _instance: unknown, info: string) => {
    const e = err as Error | undefined;
    const entry: ErrorEntry = {
      message: e?.message ?? String(err),
      stack: e?.stack,
      level: "error",
      errorCategory: info,
    };
    if (queue) queue.enqueue(entry);
    else void client.sendError(entry);
  };
}
