import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { ELSPlugin } from "../src/plugin.js";
import { useELS } from "../src/useELS.js";

const config = {
  apiKey: "test-key",
  appSlug: "test-app",
} as const;

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accepted: 1, duplicates: 0, errors: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
});

describe("ELSPlugin", () => {
  it("устанавливается и предоставляет useELS", () => {
    let captured: { hasClient: boolean } | null = null;
    const Child = defineComponent({
      setup() {
        const { client } = useELS();
        captured = { hasClient: !!client };
        return () => h("div", "ok");
      },
    });

    const wrapper = mount(Child, {
      global: {
        plugins: [[ELSPlugin, { config, captureGlobalErrors: false }]],
      },
    });

    expect(wrapper.text()).toBe("ok");
    expect(captured).toEqual({ hasClient: true });
  });

  it("report отправляет через очередь (не бросает)", async () => {
    let reportFn: ((e: unknown) => void) | null = null;
    const Child = defineComponent({
      setup() {
        const { report } = useELS();
        reportFn = report;
        return () => h("div");
      },
    });
    mount(Child, {
      global: {
        plugins: [[ELSPlugin, { config, captureGlobalErrors: false }]],
      },
    });
    expect(reportFn).toBeTypeOf("function");
    expect(() => reportFn?.(new Error("boom"))).not.toThrow();
  });

  it("устанавливает app.config.errorHandler", () => {
    const Child = defineComponent({
      setup: () => () => h("div"),
    });
    const wrapper = mount(Child, {
      global: {
        plugins: [[ELSPlugin, { config, captureGlobalErrors: false }]],
      },
    });
    expect(wrapper.vm.$.appContext.app.config.errorHandler).toBeTypeOf(
      "function",
    );
  });

  it("бросает если options.config отсутствует", () => {
    const Child = defineComponent({ setup: () => () => h("div") });
    expect(() =>
      mount(Child, {
        global: {
          // intentionally installed without `config`
          plugins: [[ELSPlugin, {}]],
        },
      }),
    ).toThrow(/config/);
  });
});
