import "@testing-library/jest-dom/vitest";

// ResponsiveContainer needs ResizeObserver; jsdom has none.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver as unknown as typeof ResizeObserver;

afterEach(() => {
  vi.unstubAllGlobals();
});
