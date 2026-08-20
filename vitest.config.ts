import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    restoreMocks: true,
    clearMocks: true,
  },
});
